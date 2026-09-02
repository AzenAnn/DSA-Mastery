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

test("program panel pins the action bar and reserves its viewport space", async () => {
  const html = await readPackageFile("src/panelHtml.ts");
  const css = await readPackageFile("media/panel.css");
  const actionbarBlock = css.match(/\.lab-actionbar\s*\{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(actionbarBlock, /position:\s*fixed/);
  assert.doesNotMatch(actionbarBlock, /position:\s*sticky/);
  assert.match(actionbarBlock, /bottom:\s*16px/);
  assert.match(actionbarBlock, /padding:\s*6px/);
  assert.match(actionbarBlock, /border-radius:\s*10px/);
  assert.match(css, /\.lab-actionbar \.lab-button\s*\{[\s\S]*?min-height:\s*32px/);
  assert.match(css, /\.program-page\s*\{[\s\S]*?--lab-actionbar-reserve/);
  assert.match(css, /padding-bottom:\s*var\(--lab-actionbar-reserve\)/);
  assert.match(html, /class="program-scroll-region"/);
  assert.match(css, /body\.program-body[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /\.program-scroll-region\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(html, /const readingSurface = document\.querySelector\("\.lab-reading-surface"\)/);
  assert.match(html, /actionbar\.style\.left/);
  assert.match(html, /actionbar\.style\.width/);
  assert.match(html, /new ResizeObserver/);
});

test("quiz panel uses the shared WebView shell without adding sidebar navigation", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  assert.match(html, /class="lab-page quiz-page"/);
  assert.match(html, /class="readme"/);
  assert.match(html, /class="course-quiz"/);
  assert.doesNotMatch(html, /class="chapter-sidebar"/);
});

test("program and quiz panels expose the stable Lab ID in their metadata", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  assert.match(html, /题号 \$\{escapeHtml\(lab\.id\)\}/);
});

test("project panel exposes the task graph and manual pending state", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  assert.match(html, /renderProjectPanelHtml/);
  assert.match(html, /project-task-card/);
  assert.match(html, /PENDING/);
  assert.match(html, /ctest/);
  assert.match(html, /openProjectFile/);
  assert.match(html, /project-score-grid/);
  assert.match(html, /item\.comparison/);
  assert.match(html, /item\.output/);
});
