import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readPackageFile(relativePath: string): Promise<string> {
  return readFile(path.join(packageRoot, relativePath), "utf8");
}

test("program panel exposes a collapsible bounded result inspector", async () => {
  const html = await readPackageFile("src/panelHtml.ts");
  const css = await readPackageFile("media/panel.css");

  assert.match(html, /class="lab-workspace/);
  assert.match(html, /id="inspector-toggle"/);
  assert.match(html, /data-inspector-tab="result"/);
  assert.match(html, /data-inspector-tab="cases"/);
  assert.match(html, /const initialInspectorOpen = Boolean\(progress\?\.lastSubmission\)/);
  assert.match(html, /aria-expanded="\$\{initialOpen\}"/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*2fr\)\s+minmax\(220px,\s*min\(34%,\s*360px\)\)/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /\.lab-inspector\.is-collapsed \.inspector-toggle-text/);
});

test("program panel keeps existing host-facing controls", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  assert.match(html, /id="submit"/);
  assert.match(html, /id="open-source"/);
  assert.match(html, /id="history"/);
  assert.match(html, /id="nav-prev"/);
  assert.match(html, /id="nav-next"/);
});

test("quiz panel uses the shared WebView shell without adding sidebar navigation", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  assert.match(html, /class="lab-page quiz-page"/);
  assert.match(html, /class="readme"/);
  assert.match(html, /class="course-quiz"/);
  assert.doesNotMatch(html, /class="chapter-sidebar"/);
});
