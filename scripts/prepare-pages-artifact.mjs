import { access, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = path.join(projectRoot, "dist", "client");
const pagesRoot = path.join(projectRoot, "dist", "pages");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1) ?? "";
const derivedBasePath = repositoryName && !repositoryName.endsWith(".github.io")
  ? `/${repositoryName}`
  : "";
const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? derivedBasePath;

if (basePath && (!basePath.startsWith("/") || basePath.endsWith("/"))) {
  throw new Error(`Invalid GitHub Pages base path: ${basePath}`);
}

const nestedDirectory = basePath.replace(/^\/+/, "");
const resolvedPagesRoot = path.resolve(pagesRoot);
const resolvedDistRoot = path.resolve(projectRoot, "dist");
if (!resolvedPagesRoot.startsWith(`${resolvedDistRoot}${path.sep}`)) {
  throw new Error("Refusing to prepare an artifact outside the project dist directory.");
}

await rm(resolvedPagesRoot, { recursive: true, force: true });
await mkdir(resolvedPagesRoot, { recursive: true });

for (const entry of await readdir(clientRoot, { withFileTypes: true })) {
  if (entry.name === ".vite" || entry.name === nestedDirectory) continue;
  await cp(
    path.join(clientRoot, entry.name),
    path.join(resolvedPagesRoot, entry.name),
    { recursive: entry.isDirectory() },
  );
}

if (nestedDirectory) {
  const nestedRoot = path.join(clientRoot, nestedDirectory);
  for (const entry of await readdir(nestedRoot, { withFileTypes: true })) {
    await cp(
      path.join(nestedRoot, entry.name),
      path.join(resolvedPagesRoot, entry.name),
      { recursive: entry.isDirectory() },
    );
  }
}

await writeFile(path.join(resolvedPagesRoot, ".nojekyll"), "", "utf8");

const requiredPaths = [
  "index.html",
  "404.html",
  path.join("learn", "chapter-00-introduction", "00-overview", "index.html"),
  path.join("labs", "chapter-01", "lab-01-02-linked-list", "index.html"),
  "_next",
];

for (const relativePath of requiredPaths) {
  await access(path.join(resolvedPagesRoot, relativePath));
}

async function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(absolutePath));
    else if (entry.name.endsWith(".html")) files.push(absolutePath);
  }
  return files;
}

function artifactTargetForHref(href) {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const url = new URL(href, "https://pages.example");
  const expectedPrefix = basePath ? `${basePath}/` : "/";
  if (!url.pathname.startsWith(expectedPrefix)) {
    throw new Error(`Document navigation escaped the Pages base path: ${href}`);
  }

  const routePath = basePath ? url.pathname.slice(basePath.length) : url.pathname;
  const relativePath = routePath.replace(/^\/+/, "");
  if (!relativePath) return path.join(resolvedPagesRoot, "index.html");
  if (!routePath.endsWith("/")) {
    if (path.extname(routePath)) return path.join(resolvedPagesRoot, relativePath);
    throw new Error(`Document route is missing its trailing slash: ${href}`);
  }
  return path.join(resolvedPagesRoot, relativePath, "index.html");
}

let documentNavigationLinks = 0;
const checkedTargets = new Set();
for (const htmlPath of await collectHtmlFiles(resolvedPagesRoot)) {
  const html = await readFile(htmlPath, "utf8");
  for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
    if (!/\bdata-navigation-mode="document"/.test(tag)) continue;
    documentNavigationLinks += 1;
    const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
    if (!href) throw new Error(`Document navigation link has no href in ${htmlPath}`);
    const target = artifactTargetForHref(href);
    if (target) checkedTargets.add(target);
  }
}

if (documentNavigationLinks === 0) {
  throw new Error("Pages artifact contains no document-navigation links.");
}
for (const target of checkedTargets) await access(target);

console.log(
  `GitHub Pages artifact ready at ${path.relative(projectRoot, resolvedPagesRoot)} `
  + `(${documentNavigationLinks} document links, ${checkedTargets.size} static targets verified).`,
);
