import { access, cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
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

console.log(`GitHub Pages artifact ready at ${path.relative(projectRoot, resolvedPagesRoot)}.`);
