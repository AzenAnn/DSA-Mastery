import test, { after, before } from "node:test";
import assert from "node:assert/strict";
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

before(async () => {
  temporaryRoot = await mkdtemp(path.join(tmpdir(), "dsa-stats-render-"));
  const output = path.join(temporaryRoot, "stats-view.cjs");
  await build({
    entryPoints: [path.join(packageRoot, "src/statsView.ts")],
    outfile: output,
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  ({ renderStatsDocument } = createRequire(import.meta.url)(output));
});

after(async () => {
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
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

test("generated statistics document preserves the page shell and reading order", () => {
  const html = render();
  assert.match(html, /<body class="stats-body">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1\.0"\s*\/>/);
  assert.match(html, /<main class="lab-page stats-page" aria-labelledby="stats-title">/);
  assert.match(html, /<h1 id="stats-title">做题统计<\/h1>/);
  const markers = ['class="rank-overview"', 'class="stat-cards"', 'id="stats-activity-title"', 'id="stats-trend-title"', 'id="stats-chapters-title"'];
  const positions = markers.map((marker) => html.indexOf(marker));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((left, right) => left - right), positions);
  for (const label of ["PROGRESS OVERVIEW", "ACTIVITY", "MOMENTUM", "CURRICULUM"]) assert.ok(html.includes(label));
});

test("generated document preserves the external stylesheet and strict nonce CSP", () => {
  const html = render();
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.ok(html.includes("default-src 'none'"));
  assert.ok(html.includes(`style-src ${resources.cspSource}`));
  assert.ok(html.includes(`script-src 'nonce-${resources.nonce}'`));
  assert.ok(html.includes(`href="${resources.styleUri}"`));
  assert.match(html, new RegExp(`<script nonce="${resources.nonce}">`));
  assert.doesNotMatch(html, /unsafe-inline|unsafe-eval|<style\b|\sstyle\s*=/i);
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
  test(`renders ${name} at ${solved} distinct solved labs`, () => {
    const html = render(solvedEvents(solved));
    assert.ok(html.includes(`data-rank="${id}"`));
    assert.ok(html.includes(name));
    assert.ok(html.includes(zhName));
    assert.ok(html.includes(`${solved} solved`));
    if (solved >= 250) {
      assert.ok(html.includes("MAX RANK"));
      assert.doesNotMatch(html, /0 problems to|problems to next/i);
    } else {
      assert.ok(!html.includes("MAX RANK"));
    }
  });
}

test("14 solved remains Pupil with 20 percent progress despite repeated activity", () => {
  const events = solvedEvents(14);
  for (let index = 0; index < 58; index += 1) {
    const attempted = index % 19;
    events.push(activity("submit", attempted < 14 ? `solved-${attempted}` : `attempted-${attempted}`));
  }
  events.push(...Array.from({ length: 4 }, () => activity("pass", "solved-0")));
  const html = render(events);
  assert.ok(html.includes('data-rank="pupil"'));
  assert.match(html, /14 solved[^<]*58 submissions/);
  assert.ok(html.includes("16 problems to Specialist"));
  assert.match(html, /aria-valuenow="20"/);
  for (const [label, value] of [["提交次数", 58], ["通过次数", 18], ["尝试题目", 19], ["已解决题目", 14]]) {
    assert.match(html, new RegExp(`<dt[^>]*>${label}</dt>\\s*<dd[^>]*>${value}</dd>`));
  }
});

test("chapter titles and external resource attributes cannot inject HTML or scripts", () => {
  const chapterTitle = '<img src=x onerror="alert(1)"></script><script>alert(2)</script> & "title"';
  const html = render([], [{ chapter: 3, chapterTitle, passed: 3, total: 4 }]);
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.ok(html.includes("&lt;/script&gt;&lt;script&gt;alert(2)&lt;/script&gt;"));
  assert.ok(html.includes("&amp; &quot;title&quot;"));
  assert.ok(!html.includes(chapterTitle));
  assert.doesNotMatch(html, /<img\b|<script>alert\(2\)/i);
  assert.doesNotMatch(html, /\sstyle\s*=/i);

  const injectedUri = 'https://webview.example/panel.css" onload="alert(3)';
  const escapedResourceHtml = renderStatsDocument({ events: [], bars: [], now }, { ...resources, styleUri: injectedUri });
  assert.ok(escapedResourceHtml.includes('href="https://webview.example/panel.css&quot; onload=&quot;alert(3)"'));
  assert.doesNotMatch(escapedResourceHtml, /\sonload="/i);
});

test("zero or one pass-bearing date produces a compact trend empty state", () => {
  const noPasses = render([activity("submit", "attempted")]);
  assert.match(noPasses, /class="stats-empty trend-empty" data-trend-points="0"/);
  assert.ok(noPasses.includes("暂无通过记录。"));
  assert.doesNotMatch(noPasses, /<svg class="trend"/);

  const oneDay = render([...solvedEvents(14), activity("pass", "solved-0"), activity("submit", "next", new Date(2026, 8, 13, 12))]);
  assert.match(oneDay, /class="stats-empty trend-empty" data-trend-points="1"/);
  assert.ok(oneDay.includes("2026-09-12 · 累计通过 15 次"));
  assert.doesNotMatch(oneDay, /<svg class="trend"/);
});

test("invalid persisted dates cannot crash charts or change total activity and solved counts", () => {
  const undated: ActivityEvent[] = [
    { ...activity("submit", "undated"), at: "invalid-date" },
    { ...activity("pass", "undated"), at: "" },
  ];
  const emptyCalendar = render(undated);
  assert.ok(emptyCalendar.includes("1 solved · 1 submissions"));
  assert.match(emptyCalendar, /data-trend-points="0"/);
  assert.match(emptyCalendar, /<option value="2026" selected>2026 年<\/option>/);
  assert.doesNotMatch(emptyCalendar, /NaN|Invalid Date/);

  const dated = [
    activity("pass", "dated", new Date(2026, 8, 1, 12)),
    activity("pass", "dated", new Date(2026, 8, 2, 12)),
  ];
  const html = render([...dated, ...undated]);
  assert.ok(html.includes("2 solved · 1 submissions"));
  assert.match(html, /data-counter="passes"><dt[^>]*>通过次数<\/dt><dd[^>]*>3<\/dd>/);
  assert.ok(html.includes('aria-label="累计通过趋势，共 2 次通过"'));
  assert.doesNotMatch(html, /NaN|Invalid Date/);
});

test("heatmap covers leap years and labels local calendar dates with both event totals", () => {
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = "Asia/Shanghai";
    const leapDay = new Date(2024, 1, 29, 0, 30);
    assert.ok(leapDay.toISOString().startsWith("2024-02-28"));
    const events = [
      activity("submit", "leap", leapDay),
      activity("submit", "leap", leapDay),
      activity("pass", "leap", leapDay),
      activity("submit", "past-year", new Date(2023, 11, 31, 12)),
    ];
    const html = render(events, [], leapDay);
    assert.equal([...html.matchAll(/data-date="2024-\d{2}-\d{2}"/g)].length, 366 * 2);
    assert.equal([...html.matchAll(/data-date="2023-\d{2}-\d{2}"/g)].length, 365 * 2);
    assert.match(html, /<option value="2024" selected>2024 年<\/option>/);
    assert.match(html, /<option value="2023">2023 年<\/option>/);
    assert.match(html, /class="heatmap-cell is-today" data-date="2024-02-29" data-count="2"/);
    assert.match(html, /class="heatmap-cell is-today" data-date="2024-02-29" data-count="1"/);
    assert.ok(html.includes('aria-label="2024-02-29（今天）：提交 2 次，通过 1 次"'));
    assert.ok(html.includes("<title>2024-02-29（今天）：提交 2 次，通过 1 次</title>"));
    assert.match(html, /data-date="2024-02-28" data-count="0"/);
    assert.equal([...html.matchAll(/aria-current="date"/g)].length, 2);
    assert.equal([...html.matchAll(/<rect\b[^>]*tabindex="0"/g)].length, 4, "one keyboard entry point per year and metric");
    assert.match(html, /id="heatmap-detail" role="status" aria-live="polite"/);
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test("trend preserves cumulative pass-event units and real calendar gaps while rank uses one solved lab", () => {
  const events = [
    activity("pass", "same-lab", new Date(2026, 8, 1, 12)),
    activity("pass", "same-lab", new Date(2026, 8, 1, 13)),
    activity("pass", "same-lab", new Date(2026, 8, 2, 12)),
    activity("pass", "same-lab", new Date(2026, 8, 11, 12)),
  ];
  const html = render(events);
  assert.ok(html.includes("1 solved · 0 submissions"));
  assert.ok(html.includes('aria-label="累计通过趋势，共 4 次通过"'));
  assert.ok(html.includes("通过（次）"));
  assert.ok(html.includes("<title>2026-09-11：累计通过 4 次</title>"));
  assert.doesNotMatch(html, /累计通过 4 题/);
  const dataAttribute = html.match(/data-points="([^"]+)"/);
  assert.ok(dataAttribute);
  const points: [number, number][] = JSON.parse(dataAttribute[1]);
  assert.deepEqual(points.map((point) => point[1]), [2, 3, 4]);
  assert.equal(points[1][0] - points[0][0], 1);
  assert.equal(points[2][0] - points[1][0], 9);
  const ticks = [...html.matchAll(/class="trend-tick" data-value="(\d+)"/g)].map((match) => Number(match[1]));
  assert.deepEqual(ticks, [0, 1, 2, 3, 4]);
  assert.match(html, /class="trend-area"[^>]*fill-opacity="0\.08"/);
  assert.match(html, /class="trend-line"[^>]*stroke-width="2"/);
});

test("chapter rows expose numbers, completion counts and accessible bounded progress", () => {
  const html = render([], [
    { chapter: 1, chapterTitle: "空章节", passed: 0, total: 0 },
    { chapter: 2, chapterTitle: "线性表", passed: 1, total: 4 },
    { chapter: 3, chapterTitle: "字符串", passed: 4, total: 4 },
  ]);
  for (const number of ["01", "02", "03"]) assert.ok(html.includes(`<span class="chapter-number">${number}</span>`));
  for (const count of ["0 / 0", "1 / 4", "4 / 4"]) assert.ok(html.includes(`<span class="chapter-count">${count}</span>`));
  for (const percent of [0, 25, 100]) assert.match(html, new RegExp(`class="chapter-bar"[^>]*aria-valuenow="${percent}"`));
  assert.equal([...html.matchAll(/class="chapter-row is-complete"/g)].length, 1);
  assert.equal([...html.matchAll(/class="chapter-complete"/g)].length, 1);
  assert.ok(html.includes('viewBox="0 0 240 6"'));
  assert.doesNotMatch(html, /\sstyle\s*=/i);
});

test("StatsPanel keeps stable lab IDs and type-aware Project completion when adapting to the renderer", async () => {
  assert.ok(temporaryRoot);
  const output = path.join(temporaryRoot, "stats-panel.cjs");
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
    const { StatsPanel } = createRequire(import.meta.url)(output);
    StatsPanel.show({ extensionPath: packageRoot }, progress, [{ chapter: 1, chapterTitle: "类型感知完成度", labs }]);
    assert.deepEqual(calls, labs.map((lab) => [lab.type, lab.id]));
    assert.ok(panel.webview.html.includes('<span class="chapter-count">3 / 8</span>'));
    assert.match(panel.webview.html, /class="chapter-bar"[^>]*aria-valuenow="38"/);
    assert.ok(panel.webview.html.includes("14 solved · 0 submissions"));
    assert.equal(reveals, 1);
  } finally {
    onDispose?.();
    delete fixtureGlobal.statsPanelFixture;
  }
});
