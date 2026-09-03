import path from "node:path";
import * as vscode from "vscode";
import type { Chapter } from "./labIndex";
import { projectProgressPassed } from "./projectProgress";
import type { ProgressTracker } from "./progress";
import {
  buildChapterBars,
  buildHeatmap,
  buildTrend,
  countActivity,
  // mockEvents,  // 示例数据入口已停用,恢复时连同 render() 里的 useMock 一起解开
  type ChapterBar,
  type Heatmap,
  type TrendPoint,
} from "./stats";

const CELL = 11;
const GAP = 2;

/**
 * 色阶:索引 0 是无活动的浅灰底,往后逐级加深到深橙/深蓝。
 *
 * 用统计页的 CSS 变量而不是散落的页面颜色 —— 视觉层由 WebView
 * 共享 token 控制,同时保留显式 fallback 兼容旧版 WebView。
 */
const ORANGE = [
  "var(--stats-chart-empty, #eef0f4)",
  "var(--stats-submit-1, #fde1c7)",
  "var(--stats-submit-2, #f5b28a)",
  "var(--stats-submit-3, #e88658)",
  "var(--stats-submit-4, #c9532a)",
];
const BLUE = [
  "var(--stats-chart-empty, #eef0f4)",
  "var(--stats-pass-1, #d9ddff)",
  "var(--stats-pass-2, #aeb8ff)",
  "var(--stats-pass-3, #8290ff)",
  "var(--stats-pass-4, #5e6de6)",
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** 统计面板:单例 webview,与题目面板各自独立。 */
export class StatsPanel {
  private static current: StatsPanel | undefined;

  static show(
    context: vscode.ExtensionContext,
    progress: ProgressTracker,
    chapters: readonly Chapter[],
  ): void {
    if (!StatsPanel.current) StatsPanel.current = new StatsPanel(context);
    const panel = StatsPanel.current;
    panel.render(progress, chapters);
    panel.panel.reveal(vscode.ViewColumn.One);
  }

  private readonly panel: vscode.WebviewPanel;

  private constructor(private readonly context: vscode.ExtensionContext) {
    this.panel = vscode.window.createWebviewPanel(
      "dsaMastery.stats",
      "做题统计",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))],
      },
    );
    this.panel.onDidDispose(() => {
      StatsPanel.current = undefined;
    });

    // 示例数据开关(调试用,已停用)。要恢复:解开下面这段 + 面板里的按钮 +
    // render() 里的 useMock + package.json 的 dsaMastery.stats.mockData 声明。
    // mockEvents() 本身保留在 stats.ts,并有单测覆盖,不需要重写。
    //
    // this.panel.webview.onDidReceiveMessage(async (message: { type?: string }) => {
    //   if (message?.type !== "toggleMock") return;
    //   const config = vscode.workspace.getConfiguration("dsaMastery");
    //   const now = config.get<boolean>("stats.mockData") ?? false;
    //   await config.update("stats.mockData", !now, vscode.ConfigurationTarget.Global);
    //   this.rerender?.();
    // });
  }

  private render(progress: ProgressTracker, chapters: readonly Chapter[]): void {
    // 示例数据入口已停用。要预览图表效果,把下面两行换成:
    //   const useMock = vscode.workspace.getConfiguration("dsaMastery").get<boolean>("stats.mockData") ?? false;
    //   const events = useMock ? mockEvents(180, new Date()) : progress.events();
    const events = progress.events();
    const counters = countActivity(events);

    // 年份取「有数据的年份」并入当前年 —— 没数据的年份放进下拉框只是噪声。
    const years = [...new Set(events.map((e) => new Date(e.at).getFullYear()))];
    if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());
    years.sort((a, b) => b - a);
    const currentYear = years[0];

    // 每个年份 × 两种指标都预渲染,切换只是显隐,不回扩展取数。
    const maps = years.map((year) => {
      const from = new Date(year, 0, 1);
      const to = new Date(year, 11, 31);
      return {
        year,
        submit: renderHeatmap(buildHeatmap(events, "submit", from, to), ORANGE, "提交"),
        pass: renderHeatmap(buildHeatmap(events, "pass", from, to), BLUE, "通过"),
      };
    });

    const trend = buildTrend(events);
    const bars = buildChapterBars(chapters, (id, type) =>
      type === "quiz"
        ? !!progress.getQuiz(id)?.passed
        : type === "project"
          ? projectProgressPassed(progress.getProject(id) ?? { automatedFull: false, manualPending: 0, internalError: false })
          : !!progress.get(id)?.passed,
    );

    const cspNonce = nonce();
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, "media", "panel.css")),
    );

    this.panel.webview.html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${this.panel.webview.cspSource} data:; style-src ${this.panel.webview.cspSource}; font-src ${this.panel.webview.cspSource}; script-src 'nonce-${cspNonce}';" />
<link rel="stylesheet" href="${styleUri}" />
<title>做题统计</title>
</head>
<body class="stats-body">
<main class="lab-page stats-page" aria-labelledby="stats-title">
<header class="lab-header stats-header">
  <span class="stats-eyebrow">PROGRESS OVERVIEW</span>
  <div class="title-row"><h1 id="stats-title">做题统计</h1></div>
  <p class="stats-subtitle">提交、通过与章节完成度的汇总</p>
</header>

${renderCounters(counters)}

<section class="stats-block stats-activity" aria-labelledby="stats-activity-title">
  <div class="stats-head">
    <div class="stats-section-heading">
      <span class="stats-eyebrow">ACTIVITY</span>
      <h2 id="stats-activity-title">活动热图</h2>
    </div>
    <div class="stats-controls">
      <div class="heatmap-toggle" role="group" aria-label="活动指标">
        <button id="tab-submit" class="active" aria-pressed="true">提交次数</button>
        <button id="tab-pass" aria-pressed="false">通过次数</button>
      </div>
      <select id="year-select" aria-label="选择年份">
        ${years.map((y) => `<option value="${y}"${y === currentYear ? " selected" : ""}>${y} 年</option>`).join("")}
      </select>
    </div>
  </div>
  ${maps
    .map(
      (m) => `<div class="year-pane" data-year="${m.year}"${m.year === currentYear ? "" : " hidden"}>
    <div data-metric="submit">${m.submit}</div>
    <div data-metric="pass" hidden>${m.pass}</div>
  </div>`,
    )
    .join("\n  ")}
</section>

<section class="stats-block" aria-labelledby="stats-trend-title">
  <div class="stats-section-heading">
    <span class="stats-eyebrow">MOMENTUM</span>
    <h2 id="stats-trend-title">累计通过趋势</h2>
  </div>
  ${renderTrend(trend)}
</section>

<section class="stats-block" aria-labelledby="stats-chapters-title">
  <div class="stats-section-heading">
    <span class="stats-eyebrow">CURRICULUM</span>
    <h2 id="stats-chapters-title">章节分布</h2>
  </div>
  ${renderChapterBars(bars)}
</section>
</main>

<script nonce="${cspNonce}">
const api = acquireVsCodeApi();
const tabs = { submit: document.getElementById("tab-submit"), pass: document.getElementById("tab-pass") };
const yearSelect = document.getElementById("year-select");
let metric = "submit";

// 全部年份 × 全部指标都已渲染在 DOM 里,切换只是显隐 —— 不回扩展取数。
function apply() {
  const year = yearSelect.value;
  for (const pane of document.querySelectorAll(".year-pane")) {
    pane.hidden = pane.dataset.year !== year;
    for (const box of pane.querySelectorAll("[data-metric]")) {
      box.hidden = box.dataset.metric !== metric;
    }
  }
  for (const key of ["submit", "pass"]) {
    tabs[key].classList.toggle("active", key === metric);
    tabs[key].setAttribute("aria-pressed", String(key === metric));
  }
}

tabs.submit.addEventListener("click", () => { metric = "submit"; apply(); });
tabs.pass.addEventListener("click", () => { metric = "pass"; apply(); });
yearSelect.addEventListener("change", apply);
apply();

// 示例数据开关已停用。要恢复,解开这段并把按钮加回标题栏:
// const mockToggle = document.getElementById("mock-toggle");
// if (mockToggle) mockToggle.addEventListener("click", () => api.postMessage({ type: "toggleMock" }));
</script>
</body>
</html>`;
  }
}

function renderCounters(c: { submissions: number; passes: number; labsAttempted: number; labsPassed: number }): string {
  const card = (label: string, value: number) =>
    `<div class="stat-card"><dt class="stat-label">${escapeHtml(label)}</dt><dd class="stat-value">${value}</dd></div>`;
  return `<dl class="stat-cards" aria-label="做题总览">
  ${card("提交次数", c.submissions)}
  ${card("通过次数", c.passes)}
  ${card("提交过的题目", c.labsAttempted)}
  ${card("通过的题目", c.labsPassed)}
</dl>`;
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 顶部月份标注的高度,左侧星期标签的宽度。 */
const TOP = 16;
const LEFT = 22;

/**
 * GitHub 风格网格:一列一周,一行一个星期几。
 *
 * 列号必须按真实日期算 —— 原来用 index/7 当列、index%7 当行,只有区间恰好从
 * 周日开始才对得上;按自然年渲染时 1 月 1 日可能是任何一天,会整体错位。
 */
function renderHeatmap(map: Heatmap, palette: string[], label: string): string {
  if (map.cells.length === 0) {
    return `<p class="stats-empty">这一年还没有${escapeHtml(label)}记录。</p>`;
  }

  const first = new Date(`${map.cells[0].date}T12:00:00`);
  // 第 0 列从当年第一天所在的那一周开始,所以要减掉它在周内的偏移。
  const columnOf = (index: number) => Math.floor((index + first.getDay()) / 7);
  const columns = columnOf(map.cells.length - 1) + 1;

  const width = LEFT + columns * (CELL + GAP);
  const height = TOP + 7 * (CELL + GAP);

  const rects = map.cells
    .map((cell, index) => {
      const date = new Date(`${cell.date}T12:00:00`);
      const x = LEFT + columnOf(index) * (CELL + GAP);
      const y = TOP + date.getDay() * (CELL + GAP);
      const title = cell.count > 0 ? `${cell.date}：${cell.count} 次${label}` : `${cell.date}：无${label}`;
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${palette[cell.level]}"><title>${escapeHtml(title)}</title></rect>`;
    })
    .join("");

  // 月份标注放在该月第一天所在的列上。
  const monthLabels = map.cells
    .map((cell, index) => {
      const date = new Date(`${cell.date}T12:00:00`);
      if (date.getDate() !== 1) return "";
      const x = LEFT + columnOf(index) * (CELL + GAP);
      return `<text x="${x}" y="11" class="cal-label">${MONTHS[date.getMonth()]}</text>`;
    })
    .join("");

  // 星期标签只标奇数行,和 GitHub 一样 —— 七行全标会挤成一团。
  const weekdayLabels = WEEKDAYS
    .map((name, day) =>
      day % 2 === 1
        ? `<text x="0" y="${TOP + day * (CELL + GAP) + CELL - 1}" class="cal-label">${name}</text>`
        : "",
    )
    .join("");

  const legend = palette
    .map((color, i) => `<rect x="${i * (CELL + GAP)}" y="0" width="${CELL}" height="${CELL}" rx="2" fill="${color}" />`)
    .join("");

  return `<div class="heatmap-scroll">
  <svg width="${width}" height="${height}" role="img" aria-label="${escapeHtml(label)}热图">${monthLabels}${weekdayLabels}${rects}</svg>
</div>
<div class="heatmap-legend">
  <span>合计 ${map.total} 次${escapeHtml(label)}，单日最多 ${map.max} 次</span>
  <span class="legend-scale">
    <span>少</span>
    <svg width="${palette.length * (CELL + GAP)}" height="${CELL}">${legend}</svg>
    <span>多</span>
  </span>
</div>`;
}

/** 累计通过折线。点少于 2 个时画不出线,直接给提示。 */
function renderTrend(points: TrendPoint[]): string {
  if (points.length < 2) {
    return `<p class="stats-empty">还没有足够的通过记录来画趋势（至少需要两天有通过）。</p>`;
  }

  const width = 720;
  const height = 220;
  const left = 44;
  const right = 16;
  const top = 20;
  const bottom = 34;
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const maxValue = points[points.length - 1].cumulativePasses;
  const stepX = plotW / (points.length - 1);
  const yFor = (value: number) => top + plotH - (value / maxValue) * plotH;
  const xFor = (index: number) => left + index * stepX;

  const coords = points.map((p, i) => `${xFor(i).toFixed(1)},${yFor(p.cumulativePasses).toFixed(1)}`);

  // 面积填充让趋势更易读;渐变到透明,避免大色块压住折线。
  const area = `${left},${top + plotH} ${coords.join(" ")} ${xFor(points.length - 1).toFixed(1)},${top + plotH}`;

  // 四条横向网格线 + 左侧刻度。取整避免出现 3.5 题这种读数。
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = Math.round(maxValue * ratio);
    const y = yFor(value);
    return `<line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}" class="grid" />
  <text x="${left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="axis">${value}</text>`;
  }).join("\n  ");

  // 点太多时不画圆点,否则连成一片糊掉。
  const dots = points.length <= 40
    ? points.map((p, i) => `<circle cx="${xFor(i).toFixed(1)}" cy="${yFor(p.cumulativePasses).toFixed(1)}" r="2.5" class="trend-dot"><title>${escapeHtml(p.date)}：累计 ${p.cumulativePasses} 题</title></circle>`).join("")
    : "";

  return `<div class="trend-wrap">
<svg class="trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="累计通过趋势">
  <defs>
    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--dsa-accent, #5e6de6)" stop-opacity="0.18" />
      <stop offset="100%" stop-color="var(--dsa-accent, #5e6de6)" stop-opacity="0.02" />
    </linearGradient>
  </defs>
  ${ticks}
  <polygon fill="url(#trendFill)" points="${area}" />
  <polyline fill="none" stroke="var(--dsa-accent, #5e6de6)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${coords.join(" ")}" />
  ${dots}
  <text x="${left}" y="${height - 10}" class="axis">${escapeHtml(points[0].date)}</text>
  <text x="${width - right}" y="${height - 10}" text-anchor="end" class="axis">${escapeHtml(points[points.length - 1].date)}</text>
</svg>
</div>`;
}

function renderChapterBars(bars: ChapterBar[]): string {
  if (bars.length === 0) return `<p class="stats-empty">还没有扫描到题目。</p>`;

  // 用 SVG 而不是内联 style —— 面板 CSP 的 style-src 没有 'unsafe-inline',
  // 内联 style="width:..." 会被整个剥掉,进度条宽度变 0 就完全看不见。
  // SVG 的 width/fill 是呈现属性,不受 style-src 管,和 heatmap、趋势图一致。
  const TRACK_W = 240;
  const TRACK_H = 8;

  const rows = bars
    .map((bar) => {
      const ratio = bar.total > 0 ? bar.passed / bar.total : 0;
      const percent = Math.round(ratio * 100);
      // 完成度越高颜色越深,和 heatmap 用同一套蓝色梯度,视觉语言统一。
      const shade = percent === 0 ? BLUE[0] : BLUE[Math.min(4, Math.max(1, Math.ceil(percent / 25)))];
      // 有进度但不足 1px 时至少给 2px,否则 1/60 这种看起来仍是空的。
      const fillW = ratio > 0 ? Math.max(2, ratio * TRACK_W) : 0;

      return `<div class="chapter-row">
  <span class="chapter-name">第 ${bar.chapter} 章 · ${escapeHtml(bar.chapterTitle)}</span>
  <svg class="chapter-bar" viewBox="0 0 ${TRACK_W} ${TRACK_H}" preserveAspectRatio="none" role="img" aria-label="完成 ${percent}%">
    <rect x="0" y="0" width="${TRACK_W}" height="${TRACK_H}" rx="4" fill="var(--stats-chart-empty, #eef0f4)" />
    ${fillW > 0 ? `<rect x="0" y="0" width="${fillW.toFixed(1)}" height="${TRACK_H}" rx="4" fill="${shade}" />` : ""}
  </svg>
  <span class="chapter-count">${bar.passed}/${bar.total}</span>
</div>`;
    })
    .join("");

  return `<div class="chapter-bars">${rows}</div>`;
}
