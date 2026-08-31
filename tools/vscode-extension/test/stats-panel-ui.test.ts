import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readPackageFile(relativePath: string): Promise<string> {
  return readFile(path.join(packageRoot, relativePath), "utf8");
}

test("stats panel uses the shared WebView shell and keeps the A reading order", async () => {
  const html = await readPackageFile("src/statsPanel.ts");

  assert.match(html, /<body class="stats-body">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1\.0" \/>/);
  assert.match(html, /<main class="lab-page stats-page" aria-labelledby="stats-title">/);
  assert.match(html, /<h1 id="stats-title">做题统计<\/h1>/);
  assert.match(html, /<dl class="stat-cards" aria-label="做题总览">/);
  assert.match(html, /class="stats-block stats-activity"[\s\S]*?stats-activity-title/);
  assert.match(html, /id="stats-trend-title"/);
  assert.match(html, /id="stats-chapters-title"/);

  const overviewIndex = html.indexOf("${renderCounters(counters)}");
  const activityIndex = html.indexOf('class="stats-block stats-activity"');
  const trendIndex = html.indexOf('id="stats-trend-title"');
  const chaptersIndex = html.indexOf('id="stats-chapters-title"');
  assert.ok(overviewIndex >= 0 && overviewIndex < activityIndex);
  assert.ok(activityIndex < trendIndex && trendIndex < chaptersIndex);
});

test("stats panel keeps its controls and exposes the active metric state", async () => {
  const html = await readPackageFile("src/statsPanel.ts");

  assert.match(html, /id="tab-submit"[^>]*aria-pressed="true"/);
  assert.match(html, /id="tab-pass"[^>]*aria-pressed="false"/);
  assert.match(html, /id="year-select" aria-label="选择年份"/);
  assert.match(html, /data-metric="submit"/);
  assert.match(html, /data-metric="pass"/);
  assert.match(html, /setAttribute\("aria-pressed", String\(key === metric\)\)/);
  assert.doesNotMatch(html, /class="chapter-sidebar"/);
  assert.doesNotMatch(html, /class="lab-actionbar"/);
});

test("stats styles are scoped and keep narrow charts inside their own containers", async () => {
  const css = await readPackageFile("media/panel.css");

  assert.match(css, /\.stats-page\s*\{/);
  assert.match(css, /\.stats-page\s+\.stat-cards\s*\{/);
  assert.match(css, /\.stats-page\s+\.heatmap-scroll\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(css, /\.stats-page\s+\.trend\s*\{[\s\S]*?width:\s*100%/);
  assert.match(css, /\.stats-page[\s\S]*?min-width:\s*0/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.stats-page/);
  assert.match(css, /@media\s*\(max-width:\s*460px\)[\s\S]*?\.stats-page/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.stats-page/);
});
