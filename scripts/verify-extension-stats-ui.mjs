/* global document, getComputedStyle */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";

const repo = path.resolve(import.meta.dirname, "..");
const extension = path.join(repo, "tools/vscode-extension");
const output = path.join(repo, ".lab-cache/stats-profile");
const requireExtension = createRequire(path.join(extension, "package.json"));
const { build } = requireExtension("esbuild");
const now = new Date(2026, 8, 12, 12);
await mkdir(output, { recursive: true });
const bundle = path.join(output, "stats-view.cjs");
await build({ entryPoints: [path.join(extension, "src/statsView.ts")], outfile: bundle,
  bundle: true, platform: "node", format: "cjs", logLevel: "silent" });
const { renderStatsDocument } = requireExtension(bundle);

function event(kind, labName, date) {
  return { at: date.toISOString(), kind, labName, labType: "program" };
}

function sampleEvents() {
  const events = [];
  for (let i = 0; i < 19; i++) {
    const date = i === 0 ? new Date(2025, 11, 31, 12) : new Date(2026, 7, 24 + i, 12);
    events.push(event("submit", `lab-${i}`, date));
    if (i < 14) events.push(event("pass", `lab-${i}`, date));
  }
  for (let i = 0; i < 39; i++) events.push(event("submit", `lab-${i % 19}`, new Date(2026, 8, 1 + i % 12, 12)));
  for (let i = 0; i < 4; i++) events.push(event("pass", "lab-0", now));
  return events;
}

const bars = [
  { chapter: 1, chapterTitle: "线性表", passed: 14, total: 22 },
  { chapter: 2, chapterTitle: "栈与队列", passed: 0, total: 12 },
  { chapter: 3, chapterTitle: "串与数组", passed: 2, total: 16 },
  { chapter: 4, chapterTitle: "树与二叉树", passed: 20, total: 20 },
  { chapter: 5, chapterTitle: "图", passed: 3, total: 17 },
  { chapter: 6, chapterTitle: "查找", passed: 0, total: 0 },
  { chapter: 7, chapterTitle: "排序与算法复杂度的综合分析", passed: 1, total: 60 },
  { chapter: 8, chapterTitle: "高级数据结构", passed: 1, total: 8 },
];
const scenarios = {
  sample: { events: sampleEvents(), bars, now },
  empty: { events: [], bars: [], now },
  single: { events: [event("submit", "lab-0", now), event("pass", "lab-0", now)], bars, now },
  dense: { events: Array.from({ length: 300 }, (_, i) => [
    event("submit", `lab-${i}`, new Date(2026, 8, 12 - 299 + i, 12)),
    event("pass", `lab-${i}`, new Date(2026, 8, 12 - 299 + i, 12)),
  ]).flat(), bars, now },
};
const rankCases = [
  [0, "trainee", "Trainee"], [10, "pupil", "Pupil"], [30, "specialist", "Specialist"],
  [60, "expert", "Expert"], [100, "candidate-master", "Candidate Master"],
  [150, "master", "Master"], [200, "grandmaster", "Grandmaster"], [250, "legendary", "Legendary"],
];
for (const [solved, id] of rankCases) {
  scenarios[`rank-${id}`] = { events: Array.from({ length: solved }, (_, i) => event("pass", `lab-${i}`, now)), bars, now };
}
const themes = {
  dark: { className: "vscode-dark", background: "#1f1f1f", foreground: "#cccccc", muted: "#9d9d9d", border: "#2b2b2b", accent: "#4daafc", input: "#313131", focus: "#007fd4", contrast: "transparent" },
  light: { className: "vscode-light", background: "#ffffff", foreground: "#3b3b3b", muted: "#626262", border: "#e5e5e5", accent: "#005fb8", input: "#f8f8f8", focus: "#005fb8", contrast: "transparent" },
  hc: { className: "vscode-high-contrast", background: "#000000", foreground: "#ffffff", muted: "#ffffff", border: "#6fc3df", accent: "#3794ff", input: "#000000", focus: "#f38518", contrast: "#6fc3df" },
  "hc-light": { className: "vscode-high-contrast-light", background: "#ffffff", foreground: "#292929", muted: "#292929", border: "#0f4a85", accent: "#0f4a85", input: "#ffffff", focus: "#0f4a85", contrast: "#0f4a85" },
};
const nonce = "stats-profile-browser-verification";
const fixtureCss = Object.entries(themes).map(([name, theme]) => `body[data-fixture-theme="${name}"] {
  --vscode-editor-background: ${theme.background};
  --vscode-foreground: ${theme.foreground};
  --vscode-editor-foreground: ${theme.foreground};
  --vscode-descriptionForeground: ${theme.muted};
  --vscode-panel-border: ${theme.border};
  --vscode-widget-border: ${theme.border};
  --vscode-editorWidget-background: ${theme.input};
  --vscode-sideBar-background: ${theme.input};
  --vscode-textLink-foreground: ${theme.accent};
  --vscode-charts-blue: ${theme.accent};
  --vscode-focusBorder: ${theme.focus};
  --vscode-contrastBorder: ${theme.contrast};
  --vscode-dropdown-background: ${theme.input};
  --vscode-dropdown-foreground: ${theme.foreground};
  --vscode-dropdown-border: ${theme.border};
  --vscode-button-secondaryBackground: ${theme.input};
  --vscode-button-secondaryForeground: ${theme.foreground};
  --vscode-button-secondaryHoverBackground: ${theme.input};
  --vscode-font-family: "Segoe UI", sans-serif;
  --vscode-editor-font-family: Consolas, monospace;
  --vscode-font-size: 13px;
  background: var(--vscode-editor-background);
}`).join("\n") + '\nbody[data-fixture-scale="large"] .stats-page { zoom: 1.25; }\n';
await writeFile(path.join(output, "fixture.css"), fixtureCss);
await writeFile(path.join(output, "panel.css"), await readFile(path.join(extension, "media/panel.css")));

function renderFixture(scenario, themeName) {
  const theme = themes[themeName];
  let html = renderStatsDocument(scenarios[scenario], { cspSource: "'self'", styleUri: "./panel.css", nonce });
  const shim = `<script nonce="${nonce}">
  let fixtureState;
  try { fixtureState = JSON.parse(sessionStorage.getItem('stats-fixture-state') || 'null'); } catch {}
  window.acquireVsCodeApi = () => ({
    getState: () => fixtureState,
    setState: (state) => { fixtureState = state; try { sessionStorage.setItem('stats-fixture-state', JSON.stringify(state)); } catch {} },
    postMessage: () => {}
  });
  </script>`;
  html = html.replace("</head>", `<link rel="stylesheet" href="./fixture.css" />${shim}</head>`);
  html = html.replace('class="stats-body"', `class="stats-body ${theme.className}" data-fixture-theme="${themeName}"`);
  return html;
}

for (const scenario of Object.keys(scenarios)) {
  for (const theme of Object.keys(themes)) {
    await writeFile(path.join(output, `${scenario}-${theme}.html`), renderFixture(scenario, theme));
  }
}
console.log(`Preview: ${path.join(output, "sample-dark.html")}`);
if (process.argv.includes("--preview")) process.exit(0);

const server = createServer(async (request, response) => {
  const name = new URL(request.url, "http://localhost").pathname.slice(1);
  if (!/^[a-z-]+\.(html|css)$/.test(name)) { response.writeHead(404).end(); return; }
  try {
    const content = await readFile(path.join(output, name));
    response.writeHead(200, { "Content-Type": name.endsWith(".css") ? "text/css; charset=utf-8" : "text/html; charset=utf-8" });
    response.end(content);
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const evidence = [];
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  async function open(scenario = "sample", theme = "dark", width = 1440, height = 1000) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/${scenario}-${theme}.html`);
    await page.waitForFunction(() => {
      const chart = document.querySelector(".trend");
      return !chart || (chart.getAttribute("viewBox") && chart.querySelector("polyline"));
    });
  }

  async function layout(label, expectedColumns, expectedTrendHeight, scale = 1) {
    const dimensions = await page.evaluate(() => {
      const main = document.querySelector(".stats-page");
      const chart = document.querySelector(".trend");
      const chapters = document.querySelector(".chapter-bars");
      const heading = document.querySelector(".rank-title");
      const mainRect = main.getBoundingClientRect();
      return {
        pageWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        contentWidth: mainRect.width,
        columns: chapters ? getComputedStyle(chapters).gridTemplateColumns.split(" ").length : 0,
        chartHeight: chart?.getBoundingClientRect().height ?? 0,
        rankFits: !heading || heading.scrollWidth <= heading.clientWidth + 1,
        inlineStyles: document.querySelectorAll("[style]").length,
        chapterHeights: [...document.querySelectorAll(".chapter-bar")].map((bar) => bar.getBoundingClientRect().height),
      };
    });
    assert(dimensions.scrollWidth <= dimensions.pageWidth, `${label}: page overflow ${JSON.stringify(dimensions)}`);
    assert(dimensions.contentWidth <= 1400, `${label}: content too wide`);
    assert.equal(dimensions.columns, expectedColumns, `${label}: chapter columns`);
    if (expectedTrendHeight) assert(dimensions.chartHeight >= expectedTrendHeight[0] && dimensions.chartHeight <= expectedTrendHeight[1], `${label}: chart height ${dimensions.chartHeight}`);
    assert(dimensions.rankFits, `${label}: rank title overflow`);
    assert.equal(dimensions.inlineStyles, 0, `${label}: inline styles violate production CSP`);
    assert(dimensions.chapterHeights.every((height) => height >= 5 * scale && height <= 6 * scale), `${label}: chapter track height`);
    evidence.push({ label, ...dimensions });
  }

  async function checkContrast(selector, minimum) {
    const values = await page.locator(selector).evaluateAll((elements) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      const luminance = (color) => {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((v) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const bg = luminance(getComputedStyle(document.body).backgroundColor);
      return elements.map((element) => {
        const fg = luminance(getComputedStyle(element).color);
        return { text: element.textContent, color: getComputedStyle(element).color, ratio: (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05) };
      });
    });
    assert(values.length > 0);
    assert(values.every(({ ratio }) => ratio >= minimum), `Insufficient text contrast: ${JSON.stringify(values)}`);
    return values;
  }

  await open();
  await expect(page.locator(".rank-title")).toContainText("Pupil");
  await expect(page.locator(".rank-summary")).toContainText("14");
  await expect(page.locator(".rank-caption")).toContainText("16");
  await expect(page.locator(".rank-caption")).toContainText("Specialist");
  assert.deepEqual(await page.locator(".stat-value").allTextContents(), ["58", "18", "19", "14"]);
  assert.deepEqual(await page.locator(".stat-label").allTextContents(), ["提交次数", "通过次数", "尝试题目", "已解决题目"]);
  for (const label of ["PROGRESS OVERVIEW", "ACTIVITY", "MOMENTUM", "CURRICULUM"]) await expect(page.getByText(label, { exact: true })).toBeVisible();
  await expect(page.locator('[data-year="2026"] [data-metric="submit"]')).toBeVisible();
  await page.locator("#tab-pass").click();
  await expect(page.locator("#tab-pass")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-year="2026"] [data-metric="pass"]')).toBeVisible();
  await expect(page.locator('[data-year="2026"] [data-metric="submit"]')).toBeHidden();
  await page.locator("#year-select").selectOption("2025");
  await expect(page.locator('[data-year="2025"]')).toBeVisible();
  await page.reload();
  await expect(page.locator("#year-select")).toHaveValue("2025");
  await expect(page.locator("#tab-pass")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#year-select").selectOption("2026");
  const today = page.locator('[data-year="2026"] [data-metric="pass"] .is-today');
  await expect(today).toHaveCount(1);
  await today.focus();
  const detail = page.locator(".heatmap-detail:visible");
  await expect(detail).toContainText("2026-09-12");
  await expect(detail).toContainText("提交");
  await expect(detail).toContainText("通过");
  await page.keyboard.press("ArrowUp");
  await expect(detail).toContainText("2026-09-11");
  await page.keyboard.press("ArrowLeft");
  await expect(detail).toContainText("2026-09-04");
  await today.hover();
  await expect(detail).toContainText("2026-09-12");
  await page.locator("#tab-submit").click();

  for (const theme of Object.keys(themes)) {
    for (const [width, height] of [[1440, 1000], [375, 812]]) {
      await open("sample", theme, width, height);
      await layout(`${theme}-${width}`, width > 900 ? 2 : 1, width > 900 ? [220, 250] : [180, 220]);
      if (width < 900) await expect.poll(() => page.locator(".year-pane:not([hidden]) [data-metric]:not([hidden]) .is-today").evaluate((cell) => {
        const parent = cell.closest(".heatmap-scroll").getBoundingClientRect();
        const day = cell.getBoundingClientRect();
        return day.left >= parent.left && day.right <= parent.right;
      })).toBe(true);
      await page.screenshot({ path: path.join(output, `${theme}-${width}.png`), fullPage: true });
      await checkContrast(".stats-subtitle, .stat-label, .rank-caption, .heatmap-detail", 4.5);
      const colors = await page.locator(".heatmap-cell:visible").evaluateAll((cells) => [...new Set(cells.map((cell) => getComputedStyle(cell).fill))]);
      assert(colors.length >= 3, `${theme}: heatmap intensity is not visible`);
    }
  }
  await open("sample", "dark", 2560, 1440);
  await layout("wide-2560", 2, [220, 250]);
  await page.screenshot({ path: path.join(output, "wide-2560.png"), fullPage: true });
  await page.setViewportSize({ width: 720, height: 600 });
  await expect.poll(async () => Math.round((await page.locator(".trend").boundingBox()).height)).toBeLessThanOrEqual(250);
  await layout("resized-720", 1, [180, 250]);

  for (const scenario of ["empty", "single"]) {
    await open(scenario, "dark", 375, 812);
    await expect(page.locator(".rank-title")).toContainText("Trainee");
    await expect(page.locator(".trend")).toHaveCount(0);
    await expect(page.locator("#stats-trend-title").locator("..").locator("..")).toContainText("通过");
    await layout(scenario, scenario === "empty" ? 0 : 1);
    await page.screenshot({ path: path.join(output, `${scenario}.png`), fullPage: true });
  }
  await open("dense", "light", 375, 812);
  await expect(page.locator(".rank-title")).toContainText("Legendary");
  await expect(page.locator(".rank-caption")).toContainText(/MAX RANK|Highest rank reached/);
  assert.doesNotMatch(await page.locator(".rank-overview").innerText(), /0 problems to/);
  await layout("dense-max-rank", 1, [180, 220]);
  await page.screenshot({ path: path.join(output, "dense-max-rank.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.locator("body").evaluate((body) => { body.dataset.fixtureScale = "large"; });
  await layout("enlarged-text-reduced-motion", 1, [225, 312.5], 1.25);
  await page.locator("body").evaluate((body) => { delete body.dataset.fixtureScale; });
  await page.setViewportSize({ width: 320, height: 700 });
  await layout("minimum-width-reduced-motion", 1, [180, 220]);
  const rankColors = [];
  for (const theme of Object.keys(themes)) {
    for (const [, id, title] of rankCases) {
      await open(`rank-${id}`, theme, 320, 800);
      await expect(page.locator(".rank-title")).toHaveText(title);
      await expect(page.locator(".rank-overview")).toHaveAttribute("data-rank", id);
      await layout(`${theme}-${id}-320`, 1);
      rankColors.push({ theme, id, colors: await checkContrast(".rank-title", 3) });
      if (id === "candidate-master" && theme === "dark") await page.screenshot({ path: path.join(output, "candidate-master-320.png"), fullPage: true });
    }
  }
  assert.equal(errors.length, 0, errors.join("\n"));
  await writeFile(path.join(output, "verification.json"), JSON.stringify({ ok: true, evidence, rankColors, errors }, null, 2));
  console.log(`PASS: statistics controls, CSP, rank, four themes and responsive rendering (${evidence.length} layouts)`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
