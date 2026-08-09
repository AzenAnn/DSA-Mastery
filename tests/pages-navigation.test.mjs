import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function collectTsxFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTsxFiles(absolutePath));
    else if (entry.name.endsWith(".tsx")) files.push(absolutePath);
  }
  return files;
}

test("all internal Link components use the Pages-aware wrapper", async () => {
  const files = [
    ...await collectTsxFiles(path.join(projectRoot, "app")),
    ...await collectTsxFiles(path.join(projectRoot, "components")),
  ];
  const directNextLinkImports = [];
  const unwrappedLinkComponents = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relativePath = path.relative(projectRoot, file).replaceAll("\\", "/");
    if (/from ["']next\/link["']/.test(source)) directNextLinkImports.push(relativePath);
    if (relativePath !== "components/site-link.tsx" && /<Link\b/.test(source)
      && !/SiteLink as Link/.test(source)) {
      unwrappedLinkComponents.push(relativePath);
    }
  }

  assert.deepEqual(directNextLinkImports, ["components/site-link.tsx"]);
  assert.deepEqual(unwrappedLinkComponents, []);
});

test("GitHub Pages builds opt into static document navigation", async () => {
  const component = await readFile(path.join(projectRoot, "components", "site-link.tsx"), "utf8");
  const workflow = await readFile(path.join(projectRoot, ".github", "workflows", "pages.yml"), "utf8");

  assert.match(component, /NEXT_PUBLIC_DEPLOY_TARGET === "github-pages"/);
  assert.match(component, /NEXT_PUBLIC_BASE_PATH/);
  assert.match(component, /data-navigation-mode="document"/);
  assert.match(workflow, /NEXT_PUBLIC_DEPLOY_TARGET:\s*github-pages/);
  assert.match(workflow, /NEXT_PUBLIC_BASE_PATH:\s*\$\{\{ steps\.pages\.outputs\.base_path \}\}/);
});
