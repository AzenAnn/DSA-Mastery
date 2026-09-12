import { getRankProgress } from "./rank";
import {
  buildHeatmap,
  buildTrend,
  countActivity,
  localDateKey,
  type ActivityEvent,
  type ChapterBar,
  type Counters,
  type Heatmap,
  type TrendPoint,
} from "./stats";

const CELL = 11;
const GAP = 2;
const TOP = 18;
const LEFT = 24;
const HEAT_COLORS = [
  "var(--stats-heat-0, #2a2c30)",
  "var(--stats-heat-1, #173b5c)",
  "var(--stats-heat-2, #1e5b8e)",
  "var(--stats-heat-3, #267bc0)",
  "var(--stats-heat-4, #4f9cff)",
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderStatsDocument(
  data: { events: readonly ActivityEvent[]; bars: ChapterBar[]; now?: Date },
  resources: { cspSource: string; styleUri: string; nonce: string },
): string {
  const { events, bars } = data;
  const now = data.now ?? new Date();
  const today = localDateKey(now.toISOString());
  const counters = countActivity(events);
  // Undated persisted activity contributes to totals but cannot be placed on a calendar.
  const datedEvents = events.filter((event) => Number.isFinite(new Date(event.at).getTime()));
  const years = [...new Set(datedEvents.map((event) => new Date(event.at).getFullYear()))];
  if (!years.includes(now.getFullYear())) years.push(now.getFullYear());
  years.sort((a, b) => b - a);
  const currentYear = years[0];
  const maps = years.map((year) => {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31);
    const submit = buildHeatmap(datedEvents, "submit", from, to);
    const pass = buildHeatmap(datedEvents, "pass", from, to);
    return {
      year,
      submit: renderHeatmap(submit, pass, "submit", today),
      pass: renderHeatmap(pass, submit, "pass", today),
    };
  });
  const cspSource = escapeHtml(resources.cspSource);
  const cspNonce = escapeHtml(resources.nonce);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} data:; style-src ${cspSource}; font-src ${cspSource}; script-src 'nonce-${cspNonce}';" />
<link rel="stylesheet" href="${escapeHtml(resources.styleUri)}" />
<title>做题统计 · DSA-Mastery</title>
</head>
<body class="stats-body">
<main class="lab-page stats-page" aria-labelledby="stats-title">
<header class="lab-header stats-header">
  <div class="stats-heading">
    <span class="stats-eyebrow">PROGRESS OVERVIEW</span>
    <div class="title-row"><h1 id="stats-title">做题统计</h1></div>
    <p class="stats-subtitle">DSA-Mastery · 算法训练</p>
  </div>
  ${renderRank(counters)}
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
        <button type="button" id="tab-submit" class="active" aria-pressed="true">提交次数</button>
        <button type="button" id="tab-pass" aria-pressed="false">通过次数</button>
      </div>
      <select id="year-select" aria-label="选择年份">
        ${years.map((year) => `<option value="${year}"${year === currentYear ? " selected" : ""}>${year} 年</option>`).join("")}
      </select>
    </div>
  </div>
  ${maps.map((map) => `<div class="year-pane" data-year="${map.year}"${map.year === currentYear ? "" : " hidden"}>
    <div data-metric="submit">${map.submit}</div>
    <div data-metric="pass" hidden>${map.pass}</div>
  </div>`).join("\n  ")}
  <p class="heatmap-detail" id="heatmap-detail" role="status" aria-live="polite" aria-atomic="true"></p>
</section>

<section class="stats-block stats-momentum" aria-labelledby="stats-trend-title">
  <div class="stats-section-heading">
    <span class="stats-eyebrow">MOMENTUM</span>
    <h2 id="stats-trend-title">累计通过趋势</h2>
  </div>
  ${renderTrend(buildTrend(datedEvents))}
</section>

<section class="stats-block stats-curriculum" aria-labelledby="stats-chapters-title">
  <div class="stats-section-heading">
    <span class="stats-eyebrow">CURRICULUM</span>
    <h2 id="stats-chapters-title">章节进度</h2>
  </div>
  ${renderChapterBars(bars)}
</section>
</main>
<script nonce="${cspNonce}">${STATS_SCRIPT}</script>
</body>
</html>`;
}

function renderRank(counters: Counters): string {
  const { rank, nextRank, progress, remaining, solvedCount } = getRankProgress(counters.labsPassed);
  const range = nextRank ? `${solvedCount} / ${nextRank.minSolved}` : `${solvedCount} solved`;
  const caption = nextRank ? `${remaining} problems to ${nextRank.name}` : "MAX RANK";

  return `<section class="rank-overview" data-rank="${rank.id}" aria-labelledby="rank-title">
  <span class="stats-eyebrow">CURRENT RANK</span>
  <div class="rank-heading">
    <h2 class="rank-title" id="rank-title">${escapeHtml(rank.name)}</h2>
    <span class="rank-meaning">${escapeHtml(rank.zhName)}</span>
  </div>
  <p class="rank-summary">${solvedCount} solved · ${counters.submissions} submissions</p>
  <svg class="rank-progress" viewBox="0 0 100 6" preserveAspectRatio="none" role="progressbar" aria-label="${escapeHtml(rank.name)} 等级进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" aria-valuetext="${escapeHtml(caption)}">
    <rect class="rank-track" width="100" height="6" rx="3" fill="var(--stats-chart-empty, #2a2c30)" />
    <rect class="rank-fill" width="${progress}" height="6" rx="3" fill="currentColor" />
  </svg>
  <div class="rank-footer"><span class="rank-caption">${escapeHtml(caption)}</span><span class="rank-range">${range}</span></div>
</section>`;
}

function renderCounters(counters: Counters): string {
  const card = (label: string, value: number, key: string) =>
    `<div class="stat-card" data-counter="${key}"><dt class="stat-label">${label}</dt><dd class="stat-value">${value}</dd></div>`;
  return `<dl class="stat-cards" aria-label="做题总览">
  ${card("提交次数", counters.submissions, "submissions")}
  ${card("通过次数", counters.passes, "passes")}
  ${card("尝试题目", counters.labsAttempted, "labsAttempted")}
  ${card("已解决题目", counters.labsPassed, "labsPassed")}
</dl>`;
}

function renderHeatmap(map: Heatmap, other: Heatmap, metric: "submit" | "pass", today: string): string {
  const label = metric === "submit" ? "提交" : "通过";
  if (map.cells.length === 0) return `<p class="stats-empty">这一年还没有${label}记录。</p>`;
  const first = new Date(`${map.cells[0].date}T12:00:00`);
  const columnOf = (index: number) => Math.floor((index + first.getDay()) / 7);
  const columns = columnOf(map.cells.length - 1) + 1;
  const width = LEFT + columns * (CELL + GAP) + 2;
  const height = TOP + 7 * (CELL + GAP) + 2;
  const preferredIndex = map.cells.findIndex((cell) => cell.date === today);
  const focusIndex = preferredIndex >= 0 ? preferredIndex : Math.max(0, map.cells.findLastIndex((cell) => cell.count > 0));

  const rects = map.cells.map((cell, index) => {
    const date = new Date(`${cell.date}T12:00:00`);
    const x = LEFT + columnOf(index) * (CELL + GAP);
    const y = TOP + date.getDay() * (CELL + GAP);
    const submits = metric === "submit" ? cell.count : other.cells[index].count;
    const passes = metric === "pass" ? cell.count : other.cells[index].count;
    const isToday = cell.date === today;
    const title = `${cell.date}${isToday ? "（今天）" : ""}：提交 ${submits} 次，通过 ${passes} 次`;
    return `<rect class="heatmap-cell${isToday ? " is-today" : ""}" data-date="${cell.date}" data-count="${cell.count}" data-detail="${escapeHtml(title)}" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${HEAT_COLORS[cell.level]}" tabindex="${index === focusIndex ? "0" : "-1"}" role="img" aria-label="${escapeHtml(title)}"${isToday ? ' aria-current="date"' : ""}><title>${escapeHtml(title)}</title></rect>`;
  }).join("");
  const monthLabels = map.cells.map((cell, index) => {
    const date = new Date(`${cell.date}T12:00:00`);
    return date.getDate() === 1
      ? `<text x="${LEFT + columnOf(index) * (CELL + GAP)}" y="12" class="cal-label">${date.getMonth() + 1}月</text>`
      : "";
  }).join("");
  const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"].map((name, day) =>
    day % 2 === 1 ? `<text x="0" y="${TOP + day * (CELL + GAP) + CELL - 1}" class="cal-label">${name}</text>` : "",
  ).join("");
  const legend = HEAT_COLORS.map((color, index) =>
    `<rect x="${index * (CELL + GAP)}" width="${CELL}" height="${CELL}" rx="2" fill="${color}" />`,
  ).join("");

  return `<div class="heatmap-scroll">
  <svg width="${width}" height="${height}" role="group" aria-label="${first.getFullYear()} 年${label}活动热图">${monthLabels}${weekdayLabels}${rects}</svg>
</div>
<div class="heatmap-legend">
  <span>合计 ${map.total} 次${label}，单日最多 ${map.max} 次</span>
  <span class="legend-scale"><span>少</span><svg width="${HEAT_COLORS.length * (CELL + GAP)}" height="${CELL}" aria-hidden="true">${legend}</svg><span>多</span></span>
</div>`;
}

/** Calendar-day distance avoids both compressed inactive periods and DST-hour offsets. */
function calendarDay(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function renderTrend(points: TrendPoint[]): string {
  if (points.length < 2) {
    const text = points.length === 0
      ? "暂无通过记录。"
      : `${escapeHtml(points[0].date)} · 累计通过 ${points[0].cumulativePasses} 次，尚无跨日趋势。`;
    return `<p class="stats-empty trend-empty" data-trend-points="${points.length}">${text}</p>`;
  }

  const width = 720;
  const height = 240;
  const left = 44;
  const right = 16;
  const top = 28;
  const bottom = 32;
  const max = points[points.length - 1].cumulativePasses;
  const from = calendarDay(points[0].date);
  const span = calendarDay(points[points.length - 1].date) - from;
  const xFor = (date: string) => left + (calendarDay(date) - from) / span * (width - left - right);
  const yFor = (value: number) => top + (1 - value / max) * (height - top - bottom);
  const coords = points.map((point) => `${xFor(point.date).toFixed(1)},${yFor(point.cumulativePasses).toFixed(1)}`).join(" ");
  const ticks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio)))];
  const tickMarkup = ticks.map((value) => `<g class="trend-tick" data-value="${value}">
    <line x1="${left}" x2="${width - right}" y1="${yFor(value)}" y2="${yFor(value)}" class="grid" />
    <text x="${left - 8}" y="${yFor(value) + 4}" text-anchor="end" class="axis">${value}</text>
  </g>`).join("");
  const dots = points.length <= 40 ? points.map((point) =>
    `<circle cx="${xFor(point.date)}" cy="${yFor(point.cumulativePasses)}" r="2.5" class="trend-dot" data-day="${calendarDay(point.date)}" data-value="${point.cumulativePasses}"><title>${escapeHtml(point.date)}：累计通过 ${point.cumulativePasses} 次</title></circle>`,
  ).join("") : "";
  const chartData = points.map((point) => [calendarDay(point.date), point.cumulativePasses]);

  return `<div class="trend-wrap">
<svg class="trend" viewBox="0 0 ${width} ${height}" data-points="${escapeHtml(JSON.stringify(chartData))}" role="img" aria-label="累计通过趋势，共 ${max} 次通过">
  <title>累计通过次数，${escapeHtml(points[0].date)} 至 ${escapeHtml(points[points.length - 1].date)}</title>
  <text class="axis trend-unit" x="${left}" y="12">通过（次）</text>
  ${tickMarkup}
  <polygon class="trend-area" fill="var(--stats-accent, #4f9cff)" fill-opacity="0.08" points="${left},${height - bottom} ${coords} ${width - right},${height - bottom}" />
  <polyline class="trend-line" fill="none" stroke="var(--stats-accent, #4f9cff)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${coords}" />
  ${dots}
  <text x="${left}" y="${height - 8}" class="axis trend-start">${escapeHtml(points[0].date)}</text>
  <text x="${width - right}" y="${height - 8}" text-anchor="end" class="axis trend-end">${escapeHtml(points[points.length - 1].date)}</text>
</svg>
</div>`;
}

function renderChapterBars(bars: ChapterBar[]): string {
  if (bars.length === 0) return `<p class="stats-empty">还没有扫描到题目。</p>`;

  const width = 240;
  const height = 6;
  const rows = bars.map((bar) => {
    const ratio = bar.total > 0 ? Math.max(0, Math.min(1, bar.passed / bar.total)) : 0;
    const percent = Math.round(ratio * 100);
    const fillWidth = ratio > 0 ? Math.max(2, ratio * width) : 0;
    const complete = bar.total > 0 && bar.passed >= bar.total;
    return `<div class="chapter-row${complete ? " is-complete" : ""}">
  <div class="chapter-heading"><span class="chapter-number">${String(bar.chapter).padStart(2, "0")}</span><span class="chapter-name">${escapeHtml(bar.chapterTitle)}</span><span class="chapter-percent">${percent}%</span></div>
  <svg class="chapter-bar" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="progressbar" aria-label="第 ${bar.chapter} 章 ${escapeHtml(bar.chapterTitle)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-valuetext="${bar.passed} / ${bar.total} 题已完成">
    <rect width="${width}" height="${height}" rx="3" fill="var(--stats-chart-empty, #2a2c30)" />
    <rect width="${fillWidth.toFixed(1)}" height="${height}" rx="3" fill="var(--stats-accent, #4f9cff)" />
  </svg>
  <div class="chapter-footer"><span class="chapter-count">${bar.passed} / ${bar.total}</span>${complete ? '<span class="chapter-complete"><span aria-hidden="true">&#10003;</span> 已完成</span>' : ""}</div>
</div>`;
  }).join("");
  return `<div class="chapter-bars">${rows}</div>`;
}

const STATS_SCRIPT = `
const api = acquireVsCodeApi();
const tabs = { submit: document.getElementById("tab-submit"), pass: document.getElementById("tab-pass") };
const yearSelect = document.getElementById("year-select");
const detail = document.getElementById("heatmap-detail");
const saved = api.getState() || {};
let metric = saved.metric === "pass" ? "pass" : "submit";
if (Array.from(yearSelect.options).some((option) => option.value === String(saved.year))) {
  yearSelect.value = String(saved.year);
}

function showDetail(cell) {
  if (cell) detail.textContent = cell.dataset.detail;
}

function revealDay(cell, preferRecent = false) {
  if (!cell) return;
  const scroller = cell.closest(".heatmap-scroll");
  const bounds = scroller.getBoundingClientRect();
  const day = cell.getBoundingClientRect();
  const left = bounds.left + scroller.clientLeft;
  const right = left + scroller.clientWidth;
  if (preferRecent) scroller.scrollLeft += day.right - right + 26;
  else if (day.left < left) scroller.scrollLeft += day.left - left - 2;
  else if (day.right > right) scroller.scrollLeft += day.right - right + 2;
}

function apply() {
  const year = yearSelect.value;
  for (const pane of document.querySelectorAll(".year-pane")) {
    pane.hidden = pane.dataset.year !== year;
    for (const box of pane.querySelectorAll("[data-metric]")) {
      box.hidden = box.dataset.metric !== metric;
      if (!pane.hidden && !box.hidden) showDetail(box.querySelector('.heatmap-cell[tabindex="0"]'));
    }
  }
  for (const key of ["submit", "pass"]) {
    tabs[key].classList.toggle("active", key === metric);
    tabs[key].setAttribute("aria-pressed", String(key === metric));
  }
  api.setState({ ...saved, year, metric });
  requestAnimationFrame(() => {
    const visible = document.querySelector('.year-pane:not([hidden]) [data-metric]:not([hidden])');
    revealDay(visible.querySelector('.heatmap-cell[tabindex="0"]'), true);
  });
}

tabs.submit.addEventListener("click", () => { metric = "submit"; apply(); });
tabs.pass.addEventListener("click", () => { metric = "pass"; apply(); });
yearSelect.addEventListener("change", apply);
apply();

for (const grid of document.querySelectorAll(".heatmap-scroll svg")) {
  const cells = Array.from(grid.querySelectorAll(".heatmap-cell"));
  grid.addEventListener("pointerover", (event) => {
    if (event.target.classList.contains("heatmap-cell")) showDetail(event.target);
  });
  grid.addEventListener("focusin", (event) => {
    if (!event.target.classList.contains("heatmap-cell")) return;
    for (const cell of cells) cell.setAttribute("tabindex", cell === event.target ? "0" : "-1");
    showDetail(event.target);
  });
  grid.addEventListener("keydown", (event) => {
    const index = cells.indexOf(event.target);
    if (index < 0) return;
    const steps = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    let next;
    if (event.key in steps) next = Math.max(0, Math.min(cells.length - 1, index + steps[event.key]));
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = cells.length - 1;
    else return;
    event.preventDefault();
    cells[next].focus({ preventScroll: true });
    revealDay(cells[next]);
  });
}

const trend = document.querySelector(".trend");
if (trend) {
  const points = JSON.parse(trend.dataset.points);
  const firstDay = points[0][0];
  const span = points[points.length - 1][0] - firstDay;
  const max = points[points.length - 1][1];
  function resizeTrend() {
    const { width, height } = trend.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    const labels = Array.from(trend.querySelectorAll(".trend-tick text"));
    const left = Math.max(36, ...labels.map((label) => label.getComputedTextLength() + 12));
    const right = 12;
    const top = 28;
    const bottom = 32;
    const baseline = height - bottom;
    const xFor = (day) => left + (day - firstDay) / span * Math.max(1, width - left - right);
    const yFor = (value) => top + (1 - value / max) * Math.max(1, height - top - bottom);
    const coords = points.map(([day, value]) => xFor(day).toFixed(1) + "," + yFor(value).toFixed(1)).join(" ");
    trend.setAttribute("viewBox", "0 0 " + width + " " + height);
    trend.querySelector(".trend-line").setAttribute("points", coords);
    trend.querySelector(".trend-area").setAttribute("points", left + "," + baseline + " " + coords + " " + (width - right) + "," + baseline);
    for (const tick of trend.querySelectorAll(".trend-tick")) {
      const y = yFor(Number(tick.dataset.value));
      const line = tick.querySelector("line");
      line.setAttribute("x1", left);
      line.setAttribute("x2", width - right);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      const label = tick.querySelector("text");
      label.setAttribute("x", left - 8);
      label.setAttribute("y", y + 4);
    }
    for (const dot of trend.querySelectorAll(".trend-dot")) {
      dot.setAttribute("cx", xFor(Number(dot.dataset.day)));
      dot.setAttribute("cy", yFor(Number(dot.dataset.value)));
    }
    trend.querySelector(".trend-unit").setAttribute("x", left);
    const start = trend.querySelector(".trend-start");
    const end = trend.querySelector(".trend-end");
    start.setAttribute("x", left);
    start.setAttribute("y", height - 8);
    end.setAttribute("x", width - right);
    end.setAttribute("y", height - 8);
  }
  new ResizeObserver(resizeTrend).observe(trend);
  resizeTrend();
}
`;
