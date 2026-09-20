import { afterAll, beforeAll, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import type { ActivityEvent, ChapterBar } from "../src/stats.ts";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resources = { cspSource: "https://webview.example", styleUri: "https://webview.example/panel.css", nonce: "stats-test-nonce" };
const now = new Date(2026, 8, 12, 12);
let temporaryRoot: string | undefined;
let renderStatsDocument: typeof import("../src/statsView.ts").renderStatsDocument;

beforeAll(async () => {
  temporaryRoot = await mkdtemp(path.join(tmpdir(), "dsa-stats-render-"));
  const output = path.join(temporaryRoot, "stats-view.cjs");
  await build({
    entryPoints: [path.join(packageRoot, "src/statsView.ts")],
    outfile: output,
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  ({ renderStatsDocument } = createRequire(import.meta.url)(output) as typeof import("../src/statsView.ts"));
});

afterAll(async () => {
  if (temporaryRoot !== undefined) await rm(temporaryRoot, { recursive: true, force: true });
});

function activity(kind: "submit" | "pass", labName: string, date = now, labType: ActivityEvent["labType"] = "program"): ActivityEvent {
  return { at: date.toISOString(), kind, labName, labType };
}

function solvedEvents(solved: number, date = now): ActivityEvent[] {
  return Array.from({ length: solved }, (_, index) => activity("pass", `solved-${index}`, date));
}

function render(events: ActivityEvent[] = [], bars: ChapterBar[] = [], date = now): string {
  return renderStatsDocument({ events, bars, now: date }, resources);
}

it("generated statistics document preserves the page shell and reading order", () => {
  const html = render();
  expect(html).toMatch(/<body class="stats-body">/);
  expect(html).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1\.0"\s*\/>/);
  expect(html).toMatch(/<main class="lab-page stats-page" aria-labelledby="stats-title">/);
  expect(html).toMatch(/<h1 id="stats-title">做题统计<\/h1>/);
  const markers = ['class="rank-overview"', 'class="stat-cards"', 'id="stats-activity-title"', 'id="stats-trend-title"', 'id="stats-chapters-title"'];
  const positions = markers.map((marker) => html.indexOf(marker));
  expect(positions.every((position) => position >= 0)).toBeTruthy();
  expect([...positions].sort((left, right) => left - right)).toStrictEqual(positions);
  for (const label of ["PROGRESS OVERVIEW", "ACTIVITY", "MOMENTUM", "CURRICULUM"]) expect(html.includes(label)).toBeTruthy();
});

it("generated document preserves the external stylesheet and strict nonce CSP", () => {
  const html = render();
  expect(html).toMatch(/http-equiv="Content-Security-Policy"/);
  expect(html.includes("default-src 'none'")).toBeTruthy();
  expect(html.includes(`style-src ${resources.cspSource}`)).toBeTruthy();
  expect(html.includes(`script-src 'nonce-${resources.nonce}'`)).toBeTruthy();
  expect(html.includes(`href="${resources.styleUri}"`)).toBeTruthy();
  expect(html).toMatch(new RegExp(`<script nonce="${resources.nonce}">`));
  expect(html).not.toMatch(/unsafe-inline|unsafe-eval|<style\b|\sstyle\s*=/i);
});

const renderedRanks: [number, string, string, string][] = [
  [0, "trainee", "Trainee", "训练者"],
  [10, "pupil", "Pupil", "学徒"],
  [30, "specialist", "Specialist", "专精者"],
  [60, "expert", "Expert", "专家"],
  [100, "candidate-master", "Candidate Master", "候选大师"],
  [150, "master", "Master", "大师"],
  [200, "grandmaster", "Grandmaster", "宗师"],
  [250, "legendary", "Legendary", "传奇"],
  [300, "legendary", "Legendary", "传奇"],
];

for (const [solved, id, name, zhName] of renderedRanks) {
  it(`renders ${name} at ${solved} distinct solved labs`, () => {
    const html = render(solvedEvents(solved));
    expect(html.includes(`data-rank="${id}"`)).toBeTruthy();
    expect(html.includes(name)).toBeTruthy();
    expect(html.includes(zhName)).toBeTruthy();
    expect(html.includes(`${solved} solved`)).toBeTruthy();
    if (solved >= 250) {
      expect(html.includes("MAX RANK")).toBeTruthy();
      expect(html).not.toMatch(/0 problems to|problems to next/i);
    } else {
      expect(!html.includes("MAX RANK")).toBeTruthy();
    }
  });
}

it("14 solved remains Pupil with 20 percent progress despite repeated activity", () => {
  const events = solvedEvents(14);
  for (let index = 0; index < 58; index += 1) {
    const attempted = index % 19;
    events.push(activity("submit", attempted < 14 ? `solved-${attempted}` : `attempted-${attempted}`));
  }
  events.push(...Array.from({ length: 4 }, () => activity("pass", "solved-0")));
  const html = render(events);
  expect(html.includes('data-rank="pupil"')).toBeTruthy();
  expect(html).toMatch(/14 solved[^<]*58 submissions/);
  expect(html.includes("16 problems to Specialist")).toBeTruthy();
  expect(html).toMatch(/aria-valuenow="20"/);
  for (const [label, value] of [["提交次数", 58], ["通过次数", 18], ["尝试题目", 19], ["已解决题目", 14]]) {
    expect(html).toMatch(new RegExp(`<dt[^>]*>${label}</dt>\\s*<dd[^>]*>${value}</dd>`));
  }
});

it("chapter titles and external resource attributes cannot inject HTML or scripts", () => {
  const chapterTitle = '<img src=x onerror="alert(1)"></script><script>alert(2)</script> & "title"';
  const html = render([], [{ chapter: 3, chapterTitle, passed: 3, total: 4 }]);
  expect(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")).toBeTruthy();
  expect(html.includes("&lt;/script&gt;&lt;script&gt;alert(2)&lt;/script&gt;")).toBeTruthy();
  expect(html.includes("&amp; &quot;title&quot;")).toBeTruthy();
  expect(!html.includes(chapterTitle)).toBeTruthy();
  expect(html).not.toMatch(/<img\b|<script>alert\(2\)/i);
  expect(html).not.toMatch(/\sstyle\s*=/i);

  const injectedUri = 'https://webview.example/panel.css" onload="alert(3)';
  const escapedResourceHtml = renderStatsDocument({ events: [], bars: [], now }, { ...resources, styleUri: injectedUri });
  expect(escapedResourceHtml.includes('href="https://webview.example/panel.css&quot; onload=&quot;alert(3)"')).toBeTruthy();
  expect(escapedResourceHtml).not.toMatch(/\sonload="/i);
});

it("zero or one pass-bearing date produces a compact trend empty state", () => {
  const noPasses = render([activity("submit", "attempted")]);
  expect(noPasses).toMatch(/class="stats-empty trend-empty" data-trend-points="0"/);
  expect(noPasses.includes("暂无通过记录。")).toBeTruthy();
  expect(noPasses).not.toMatch(/<svg class="trend"/);

  const oneDay = render([...solvedEvents(14), activity("pass", "solved-0"), activity("submit", "next", new Date(2026, 8, 13, 12))]);
  expect(oneDay).toMatch(/class="stats-empty trend-empty" data-trend-points="1"/);
  expect(oneDay.includes("2026-09-12 · 累计通过 15 次")).toBeTruthy();
  expect(oneDay).not.toMatch(/<svg class="trend"/);
});

it("invalid persisted dates cannot crash charts or change total activity and solved counts", () => {
  const undated: ActivityEvent[] = [
    { ...activity("submit", "undated"), at: "invalid-date" },
    { ...activity("pass", "undated"), at: "" },
  ];
  const emptyCalendar = render(undated);
  expect(emptyCalendar.includes("1 solved · 1 submissions")).toBeTruthy();
  expect(emptyCalendar).toMatch(/data-trend-points="0"/);
  expect(emptyCalendar).toMatch(/<option value="2026" selected>2026 年<\/option>/);
  expect(emptyCalendar).not.toMatch(/NaN|Invalid Date/);

  const dated = [
    activity("pass", "dated", new Date(2026, 8, 1, 12)),
    activity("pass", "dated", new Date(2026, 8, 2, 12)),
  ];
  const html = render([...dated, ...undated]);
  expect(html.includes("2 solved · 1 submissions")).toBeTruthy();
  expect(html).toMatch(/data-counter="passes"><dt[^>]*>通过次数<\/dt><dd[^>]*>3<\/dd>/);
  expect(html.includes('aria-label="累计通过趋势，共 2 次通过"')).toBeTruthy();
  expect(html).not.toMatch(/NaN|Invalid Date/);
});

it("heatmap covers leap years and labels local calendar dates with both event totals", () => {
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = "Asia/Shanghai";
    const leapDay = new Date(2024, 1, 29, 0, 30);
    expect(leapDay.toISOString().startsWith("2024-02-28")).toBeTruthy();
    const events = [
      activity("submit", "leap", leapDay),
      activity("submit", "leap", leapDay),
      activity("pass", "leap", leapDay),
      activity("submit", "past-year", new Date(2023, 11, 31, 12)),
    ];
    const html = render(events, [], leapDay);
    expect([...html.matchAll(/data-date="2024-\d{2}-\d{2}"/g)].length).toBe(366 * 2);
    expect([...html.matchAll(/data-date="2023-\d{2}-\d{2}"/g)].length).toBe(365 * 2);
    expect(html).toMatch(/<option value="2024" selected>2024 年<\/option>/);
    expect(html).toMatch(/<option value="2023">2023 年<\/option>/);
    expect(html).toMatch(/class="heatmap-cell is-today" data-date="2024-02-29" data-count="2"/);
    expect(html).toMatch(/class="heatmap-cell is-today" data-date="2024-02-29" data-count="1"/);
    expect(html.includes('aria-label="2024-02-29（今天）：提交 2 次，通过 1 次"')).toBeTruthy();
    expect(html.includes("<title>2024-02-29（今天）：提交 2 次，通过 1 次</title>")).toBeTruthy();
    expect(html).toMatch(/data-date="2024-02-28" data-count="0"/);
    expect([...html.matchAll(/aria-current="date"/g)].length).toBe(2);
    expect([...html.matchAll(/<rect\b[^>]+tabindex="0"/g)].length, "one keyboard entry point per year and metric").toBe(4);
    expect(html).toMatch(/id="heatmap-detail" role="status" aria-live="polite"/);
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

it("trend preserves cumulative pass-event units and real calendar gaps while rank uses one solved lab", () => {
  const events = [
    activity("pass", "same-lab", new Date(2026, 8, 1, 12)),
    activity("pass", "same-lab", new Date(2026, 8, 1, 13)),
    activity("pass", "same-lab", new Date(2026, 8, 2, 12)),
    activity("pass", "same-lab", new Date(2026, 8, 11, 12)),
  ];
  const html = render(events);
  expect(html.includes("1 solved · 0 submissions")).toBeTruthy();
  expect(html.includes('aria-label="累计通过趋势，共 4 次通过"')).toBeTruthy();
  expect(html.includes("通过（次）")).toBeTruthy();
  expect(html.includes("<title>2026-09-11：累计通过 4 次</title>")).toBeTruthy();
  expect(html).not.toMatch(/累计通过 4 题/);
  const dataAttribute = html.match(/data-points="([^"]+)"/);
  expect(dataAttribute).toBeTruthy();
  const points = JSON.parse(dataAttribute![1]) as [number, number][];
  expect(points.map((point) => point[1])).toStrictEqual([2, 3, 4]);
  expect(points[1][0] - points[0][0]).toBe(1);
  expect(points[2][0] - points[1][0]).toBe(9);
  const ticks = [...html.matchAll(/class="trend-tick" data-value="(\d+)"/g)].map((match) => Number(match[1]));
  expect(ticks).toStrictEqual([0, 1, 2, 3, 4]);
  expect(html).toMatch(/class="trend-area"[^>]*fill-opacity="0\.08"/);
  expect(html).toMatch(/class="trend-line"[^>]*stroke-width="2"/);
});

it("chapter rows expose numbers, completion counts and accessible bounded progress", () => {
  const html = render([], [
    { chapter: 1, chapterTitle: "空章节", passed: 0, total: 0 },
    { chapter: 2, chapterTitle: "线性表", passed: 1, total: 4 },
    { chapter: 3, chapterTitle: "字符串", passed: 4, total: 4 },
  ]);
  for (const number of ["01", "02", "03"]) expect(html.includes(`<span class="chapter-number">${number}</span>`)).toBeTruthy();
  for (const count of ["0 / 0", "1 / 4", "4 / 4"]) expect(html.includes(`<span class="chapter-count">${count}</span>`)).toBeTruthy();
  for (const percent of [0, 25, 100]) expect(html).toMatch(new RegExp(`class="chapter-bar"[^>]*aria-valuenow="${percent}"`));
  expect([...html.matchAll(/class="chapter-row is-complete"/g)].length).toBe(1);
  expect([...html.matchAll(/class="chapter-complete"/g)].length).toBe(1);
  expect(html.includes('viewBox="0 0 240 6"')).toBeTruthy();
  expect(html).not.toMatch(/\sstyle\s*=/i);
});

it("StatsPanel keeps stable lab IDs and type-aware Project completion when adapting to the renderer", async () => {
  expect(temporaryRoot).toBeTruthy();
  const output = path.join(temporaryRoot!, "stats-panel.cjs");
  const calls: [string, string][] = [];
  let onDispose: (() => void) | undefined;
  let reveals = 0;
  const panel = {
    webview: { html: "", cspSource: resources.cspSource, asWebviewUri: (uri: unknown) => uri },
    onDidDispose(callback: () => void) { onDispose = callback; },
    reveal() { reveals += 1; },
  };
  const fixture = {
    ViewColumn: { One: 1 },
    Uri: { file: (value: string) => ({ toString: () => value }) },
    window: { createWebviewPanel: () => panel },
  };
  const fixtureGlobal = globalThis as unknown as { statsPanelFixture?: unknown };
  fixtureGlobal.statsPanelFixture = fixture;
  try {
    await build({
      entryPoints: [path.join(packageRoot, "src/statsPanel.ts")],
      outfile: output, bundle: true, platform: "node", format: "cjs",
      plugins: [{ name: "stats-panel-fixture", setup(builder) {
        builder.onResolve({ filter: /^vscode$/ }, () => ({ path: "vscode", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "module.exports = globalThis.statsPanelFixture;" }));
      } }],
    });
    const projects: Record<string, unknown> = {
      "01P01": { automatedFull: true, manualPending: 0, internalError: false },
      "01P02": { automatedFull: true, manualPending: 1, internalError: false },
      "01P03": { automatedFull: true, manualPending: 0, internalError: true },
      "01P04": { automatedFull: true, manualPending: 0, internalError: false, current: { complete: false } },
      "01P05": { automatedFull: true, manualPending: 0, internalError: false, currentUnknown: true },
    };
    const progress = {
      events: () => solvedEvents(14),
      get(id: string) { calls.push(["program", id]); return { passed: true }; },
      getQuiz(id: string) { calls.push(["quiz", id]); return { passed: true }; },
      getProject(id: string) { calls.push(["project", id]); return projects[id]; },
    };
    const labs = [
      { id: "01E01", name: "old-program-name", type: "program" },
      { id: "01T01", name: "old-quiz-name", type: "quiz" },
      ...Array.from({ length: 6 }, (_, index) => ({ id: `01P0${index + 1}`, name: `old-project-${index}`, type: "project" })),
    ];
    // 打包产物只被这个用例按 show 一个入口驱动，替身也只实现到这个程度。
    const { StatsPanel } = createRequire(import.meta.url)(output) as {
      StatsPanel: { show: (context: object, progress: object, chapters: object[]) => void };
    };
    StatsPanel.show({ extensionPath: packageRoot }, progress, [{ chapter: 1, chapterTitle: "类型感知完成度", labs }]);
    expect(calls).toStrictEqual(labs.map((lab) => [lab.type, lab.id]));
    expect(panel.webview.html.includes('<span class="chapter-count">3 / 8</span>')).toBeTruthy();
    expect(panel.webview.html).toMatch(/class="chapter-bar"[^>]*aria-valuenow="38"/);
    expect(panel.webview.html.includes("14 solved · 0 submissions")).toBeTruthy();
    expect(reveals).toBe(1);
  } finally {
    onDispose?.();
    delete fixtureGlobal.statsPanelFixture;
  }
});
