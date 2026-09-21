import type { ActivityEvent, ChapterBar } from "../../apps/vscode-extension/src/progress/stats.ts";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { Browser, Locator, Page } from "playwright";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { afterAll, beforeAll, it } from "vitest";
import { renderStatsDocument } from "../../apps/vscode-extension/src/views/stats-view.ts";
import { expect } from "../support/pw-expect.ts";
import { REPO_ROOT } from "../support/repo.ts";

const EXTENSION = path.join(REPO_ROOT, "apps", "vscode-extension");
const NONCE = "stats-profile-browser-verification";
const now = new Date(2026, 8, 12, 12);

function event(kind: "submit" | "pass", labName: string, date: Date): ActivityEvent {
  return { at: date.toISOString(), kind, labName, labType: "program" };
}

function sampleEvents(): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (let i = 0; i < 19; i += 1) {
    const date = i === 0 ? new Date(2025, 11, 31, 12) : new Date(2026, 7, 24 + i, 12);
    events.push(event("submit", `lab-${i}`, date));
    if (i < 14) events.push(event("pass", `lab-${i}`, date));
  }
  for (let i = 0; i < 39; i += 1) events.push(event("submit", `lab-${i % 19}`, new Date(2026, 8, 1 + (i % 12), 12)));
  for (let i = 0; i < 4; i += 1) events.push(event("pass", "lab-0", now));

  return events;
}

const bars: ChapterBar[] = [
  { chapter: 1, chapterTitle: "线性表", passed: 14, total: 22 },
  { chapter: 2, chapterTitle: "栈与队列", passed: 0, total: 12 },
  { chapter: 3, chapterTitle: "串与数组", passed: 2, total: 16 },
  { chapter: 4, chapterTitle: "树与二叉树", passed: 20, total: 20 },
  { chapter: 5, chapterTitle: "图", passed: 3, total: 17 },
  { chapter: 6, chapterTitle: "查找", passed: 0, total: 0 },
  { chapter: 7, chapterTitle: "排序与算法复杂度的综合分析", passed: 1, total: 60 },
  { chapter: 8, chapterTitle: "高级数据结构", passed: 1, total: 8 },
];

const RANKS = [
  [0, "trainee", "Trainee"],
  [10, "pupil", "Pupil"],
  [30, "specialist", "Specialist"],
  [60, "expert", "Expert"],
  [100, "candidate-master", "Candidate Master"],
  [150, "master", "Master"],
  [200, "grandmaster", "Grandmaster"],
  [250, "legendary", "Legendary"],
] as const;

const scenarios: Record<string, { events: ActivityEvent[]; bars: ChapterBar[]; now: Date }> = {
  sample: { events: sampleEvents(), bars, now },
  empty: { events: [], bars: [], now },
  single: { events: [event("submit", "lab-0", now), event("pass", "lab-0", now)], bars, now },
  dense: {
    events: Array.from({ length: 300 }, (_, i) => [
      event("submit", `lab-${i}`, new Date(2026, 8, 12 - 299 + i, 12)),
      event("pass", `lab-${i}`, new Date(2026, 8, 12 - 299 + i, 12)),
    ]).flat(),
    bars,
    now,
  },
};
for (const [solved, id] of RANKS) {
  scenarios[`rank-${id}`] = {
    events: Array.from({ length: solved }, (_, i) => event("pass", `lab-${i}`, now)),
    bars,
    now,
  };
}

// 扩展只拿到 VS Code 注入的这批变量，主题差异全从这里来。
const themes = {
  dark: {
    className: "vscode-dark",
    background: "#1f1f1f",
    foreground: "#cccccc",
    muted: "#9d9d9d",
    border: "#2b2b2b",
    accent: "#4daafc",
    input: "#313131",
    focus: "#0078d4",
    contrast: "transparent",
  },
  light: {
    className: "vscode-light",
    background: "#ffffff",
    foreground: "#3b3b3b",
    muted: "#626262",
    border: "#e5e5e5",
    accent: "#005fb8",
    input: "#f8f8f8",
    focus: "#005fb8",
    contrast: "transparent",
  },
  hc: {
    className: "vscode-high-contrast",
    background: "#000000",
    foreground: "#ffffff",
    muted: "#ffffff",
    border: "#6fc3df",
    accent: "#3794ff",
    input: "#0c141f",
    focus: "#f38518",
    contrast: "#6fc3df",
  },
  "hc-light": {
    className: "vscode-high-contrast-light",
    background: "#ffffff",
    foreground: "#292929",
    muted: "#292929",
    border: "#0f4a85",
    accent: "#0f4a85",
    input: "#ffffff",
    focus: "#006bb3",
    contrast: "#0f4a85",
  },
};

type ThemeName = keyof typeof themes;

let fixtures: string;
let server: Server;
let browser: Browser;
let baseUrl: string;

function fixtureCss(): string {
  const blocks = Object.entries(themes).map(
    ([name, theme]) => `body[data-fixture-theme="${name}"] {
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
}`,
  );

  return `${blocks.join("\n")}\nbody[data-fixture-scale="large"] .stats-page { zoom: 1.25; }\n`;
}

function renderFixture(scenario: string, themeName: ThemeName): string {
  // Webview 里 acquireVsCodeApi 由宿主注入，这里用 sessionStorage 顶上，才能验证刷新后的状态保持。
  const shim = `<script nonce="${NONCE}">
  let fixtureState;
  try { fixtureState = JSON.parse(sessionStorage.getItem('stats-fixture-state') || 'null'); } catch {}
  window.acquireVsCodeApi = () => ({
    getState: () => fixtureState,
    setState: (state) => { fixtureState = state; try { sessionStorage.setItem('stats-fixture-state', JSON.stringify(state)); } catch {} },
    postMessage: () => {}
  });
  </script>`;

  return renderStatsDocument(scenarios[scenario], { cspSource: "'self'", styleUri: "./panel.css", nonce: NONCE })
    .replace("</head>", `<link rel="stylesheet" href="./fixture.css" />${shim}</head>`)
    .replace(
      'class="stats-body"',
      `class="stats-body ${themes[themeName].className}" data-fixture-theme="${themeName}"`,
    );
}

beforeAll(async () => {
  fixtures = await mkdtemp(path.join(tmpdir(), "dsa-stats-"));
  await writeFile(path.join(fixtures, "fixture.css"), fixtureCss(), "utf8");
  await writeFile(path.join(fixtures, "panel.css"), await readFile(path.join(EXTENSION, "media", "panel.css")));
  await Promise.all(
    Object.keys(scenarios).flatMap((scenario) =>
      Object.keys(themes).map((theme) =>
        writeFile(
          path.join(fixtures, `${scenario}-${theme}.html`),
          renderFixture(scenario, theme as ThemeName),
          "utf8",
        ),
      ),
    ),
  );
  server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const name = new URL(request.url ?? "/", "http://127.0.0.1").pathname.slice(1);
    // 浏览器自己会去要 favicon，不应答就会在页面控制台留下一条 404。
    if (name === "favicon.ico") {
      response.writeHead(204).end();

      return;
    }
    if (!/^[a-z0-9-]+\.(?:html|css)$/u.test(name)) {
      response.writeHead(404).end();

      return;
    }
    readFile(path.join(fixtures, name)).then(
      (content) => {
        response.writeHead(200, {
          "content-type": name.endsWith(".css") ? "text/css; charset=utf-8" : "text/html; charset=utf-8",
        });
        response.end(content);
      },
      () => response.writeHead(404).end(),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("无法启动统计面板测试服务器。");
  baseUrl = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ channel: "chromium" });
});

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await rm(fixtures, { recursive: true, force: true });
});

async function newPage(): Promise<{ page: Page; errors: string[] }> {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  return { page, errors };
}

async function open(page: Page, scenario: string, theme: ThemeName, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto(`${baseUrl}/${scenario}-${theme}.html`);
  await page.waitForFunction(() => {
    const chart = globalThis.document.querySelector(".trend");

    return !chart || (chart.getAttribute("viewBox") !== null && chart.querySelector("polyline") !== null);
  });
}

async function assertLayout(
  page: Page,
  label: string,
  expectedColumns: number,
  trendHeight?: [number, number],
  scale = 1,
): Promise<void> {
  const dimensions = await page.evaluate(() => {
    const doc = globalThis.document;
    const main = doc.querySelector(".stats-page")!;
    const chart = doc.querySelector(".trend");
    const chapters = doc.querySelector(".chapter-bars");
    const heading = doc.querySelector(".rank-title");

    return {
      pageWidth: doc.documentElement.clientWidth,
      scrollWidth: doc.documentElement.scrollWidth,
      contentWidth: main.getBoundingClientRect().width,
      columns: chapters ? globalThis.getComputedStyle(chapters).gridTemplateColumns.split(" ").length : 0,
      chartHeight: chart?.getBoundingClientRect().height ?? 0,
      rankFits: !heading || heading.scrollWidth <= heading.clientWidth + 1,
      inlineStyles: doc.querySelectorAll("[style]").length,
      chapterHeights: [...doc.querySelectorAll(".chapter-bar")].map((bar) => bar.getBoundingClientRect().height),
    };
  });
  expect(dimensions.scrollWidth, `${label}: 页面横向溢出`).toBeLessThanOrEqual(dimensions.pageWidth);
  expect(dimensions.contentWidth, `${label}: 内容过宽`).toBeLessThanOrEqual(1400);
  expect(dimensions.columns, `${label}: 章节列数`).toBe(expectedColumns);
  if (trendHeight) {
    expect(dimensions.chartHeight, `${label}: 趋势图高度`).toBeGreaterThanOrEqual(trendHeight[0]);
    expect(dimensions.chartHeight, `${label}: 趋势图高度`).toBeLessThanOrEqual(trendHeight[1]);
  }
  expect(dimensions.rankFits, `${label}: 段位标题溢出`).toBe(true);
  // 生产环境的 CSP 不允许行内样式，渲染器一旦写 style 属性面板就整块失效。
  expect(dimensions.inlineStyles, `${label}: 行内样式违反生产 CSP`).toBe(0);
  for (const height of dimensions.chapterHeights) {
    expect(height, `${label}: 章节进度条高度`).toBeGreaterThanOrEqual(5 * scale);
    expect(height, `${label}: 章节进度条高度`).toBeLessThanOrEqual(6 * scale);
  }
}

async function assertContrast(locator: Locator, minimum: number, label: string): Promise<void> {
  const values = await locator.evaluateAll((elements) => {
    const doc = globalThis.document;
    const canvas = doc.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const luminance = (color: string) => {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
        const channel = value / 255;

        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });

      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const background = luminance(globalThis.getComputedStyle(doc.body).backgroundColor);

    return elements.map((element) => {
      const foreground = luminance(globalThis.getComputedStyle(element).color);

      return {
        text: element.textContent,
        ratio: (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05),
      };
    });
  });
  expect(values.length, `${label}: 没有取到文本`).toBeGreaterThan(0);
  for (const { text, ratio } of values) {
    expect(ratio, `${label}: “${text}” 对比度不足`).toBeGreaterThanOrEqual(minimum);
  }
}

it("统计面板的数字、热力图与键盘导航", async () => {
  const { page, errors } = await newPage();
  await open(page, "sample", "dark", 1440, 1000);
  await expect(page.locator(".rank-title")).toContainText("Pupil");
  await expect(page.locator(".rank-summary")).toContainText("14");
  await expect(page.locator(".rank-caption")).toContainText("16");
  await expect(page.locator(".rank-caption")).toContainText("Specialist");
  await expect(page.locator(".stat-value")).toHaveText(["58", "18", "19", "14"]);
  await expect(page.locator(".stat-label")).toHaveText(["提交次数", "通过次数", "尝试题目", "已解决题目"]);
  for (const label of ["PROGRESS OVERVIEW", "ACTIVITY", "MOMENTUM", "CURRICULUM"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }

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
  expect(errors).toEqual([]);
});

it("四种主题在宽窄两档下都不溢出且文本对比度达标", async () => {
  const { page, errors } = await newPage();
  for (const theme of Object.keys(themes) as ThemeName[]) {
    for (const [width, height] of [
      [1440, 1000],
      [375, 812],
    ] as const) {
      await open(page, "sample", theme, width, height);
      await assertLayout(page, `${theme}-${width}`, width > 900 ? 2 : 1, width > 900 ? [220, 250] : [180, 220]);
      if (width < 900) {
        await expect
          .poll(() =>
            page.locator(".year-pane:not([hidden]) [data-metric]:not([hidden]) .is-today").evaluate((cell) => {
              const parent = cell.closest(".heatmap-scroll")!.getBoundingClientRect();
              const day = cell.getBoundingClientRect();

              return day.left >= parent.left && day.right <= parent.right;
            }),
          )
          .toBe(true);
      }
      await assertContrast(
        page.locator(".stats-subtitle, .stat-label, .rank-caption, .heatmap-detail"),
        4.5,
        `${theme}-${width}`,
      );
      const fills = await page
        .locator(".heatmap-cell:visible")
        .evaluateAll((cells) => [...new Set(cells.map((cell) => globalThis.getComputedStyle(cell).fill))]);
      expect(fills.length, `${theme}: 热力图深浅不可见`).toBeGreaterThanOrEqual(3);
    }
  }
  expect(errors).toEqual([]);
});

it("超宽、缩放与最小宽度下的版式", async () => {
  const { page, errors } = await newPage();
  await open(page, "sample", "dark", 2560, 1440);
  await assertLayout(page, "wide-2560", 2, [220, 250]);

  await page.setViewportSize({ width: 720, height: 600 });
  await expect
    .poll(async () => Math.round((await page.locator(".trend").boundingBox())!.height))
    .toBeLessThanOrEqual(250);
  await assertLayout(page, "resized-720", 1, [180, 250]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.locator("body").evaluate((body) => (body.dataset.fixtureScale = "large"));
  await assertLayout(page, "enlarged-text-reduced-motion", 1, [225, 312.5], 1.25);
  await page.locator("body").evaluate((body) => delete body.dataset.fixtureScale);
  await page.setViewportSize({ width: 320, height: 700 });
  await assertLayout(page, "minimum-width-reduced-motion", 1, [180, 220]);
  expect(errors).toEqual([]);
});

it("空数据、单题与满段位场景", async () => {
  const { page, errors } = await newPage();
  for (const scenario of ["empty", "single"]) {
    await open(page, scenario, "dark", 375, 812);
    await expect(page.locator(".rank-title")).toContainText("Trainee");
    await expect(page.locator(".trend")).toHaveCount(0);
    await expect(page.locator("#stats-trend-title").locator("..").locator("..")).toContainText("通过");
    await assertLayout(page, scenario, scenario === "empty" ? 0 : 1);
  }

  await open(page, "dense", "light", 375, 812);
  await expect(page.locator(".rank-title")).toContainText("Legendary");
  await expect(page.locator(".rank-caption")).toContainText(/MAX RANK|Highest rank reached/u);
  await expect(page.locator(".rank-overview")).not.toContainText("0 problems to");
  await assertLayout(page, "dense-max-rank", 1, [180, 220]);
  expect(errors).toEqual([]);
});

it("八个段位在四种主题下的标题与配色", async () => {
  const { page, errors } = await newPage();
  for (const theme of Object.keys(themes) as ThemeName[]) {
    for (const [, id, title] of RANKS) {
      await open(page, `rank-${id}`, theme, 320, 800);
      await expect(page.locator(".rank-title")).toHaveText(title);
      await expect(page.locator(".rank-overview")).toHaveAttribute("data-rank", id);
      await assertLayout(page, `${theme}-${id}-320`, 1);
      await assertContrast(page.locator(".rank-title"), 3, `${theme}-${id}`);
    }
  }
  expect(errors).toEqual([]);
});
