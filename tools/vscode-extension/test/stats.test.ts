import test from "node:test";
import assert from "node:assert/strict";
import {
  backfillEvents,
  buildChapterBars,
  buildHeatmap,
  buildTrend,
  countActivity,
  intensity,
  localDateKey,
  mockEvents,
  type ActivityEvent,
} from "../src/stats.ts";

/** 用本地时区构造时间戳,避免测试在不同 TZ 下飘。 */
function at(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour).toISOString();
}

function event(kind: "submit" | "pass", labName: string, iso: string, labType: "program" | "quiz" = "program"): ActivityEvent {
  return { at: iso, kind, labName, labType };
}

test("counts submissions, passes and distinct labs separately", () => {
  const events = [
    event("submit", "lab-a", at(2026, 8, 1)),
    event("submit", "lab-a", at(2026, 8, 1)),
    event("pass", "lab-a", at(2026, 8, 1)),
    event("submit", "lab-b", at(2026, 8, 2)),
  ];

  const counters = countActivity(events);
  assert.equal(counters.submissions, 3);
  assert.equal(counters.passes, 1);
  // 两道不同的题被提交过,不是 3 次提交 = 3 道题。
  assert.equal(counters.labsAttempted, 2);
  assert.equal(counters.labsPassed, 1);
});

test("counts a lab as attempted even when only a pass event survived backfill", () => {
  // 迁移回填可能只留下 pass(history 被裁剪),这时仍要算作提交过。
  const counters = countActivity([event("pass", "lab-only-pass", at(2026, 7, 1))]);
  assert.equal(counters.labsAttempted, 1);
  assert.equal(counters.labsPassed, 1);
});

test("heatmap fills every day in range including empty ones", () => {
  const map = buildHeatmap(
    [event("submit", "lab-a", at(2026, 8, 3))],
    "submit",
    new Date(2026, 7, 1),
    new Date(2026, 7, 5),
  );

  // 8/1 到 8/5 共 5 天,没活动的日子必须是 level 0 的格子,不能跳过。
  assert.equal(map.cells.length, 5);
  assert.deepEqual(map.cells.map((c) => c.date), [
    "2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05",
  ]);
  assert.equal(map.cells[2].count, 1);
  assert.equal(map.cells[0].count, 0);
  assert.equal(map.cells[0].level, 0);
  assert.equal(map.total, 1);
});

test("heatmap counts only the requested kind", () => {
  const events = [
    event("submit", "lab-a", at(2026, 8, 1)),
    event("pass", "lab-a", at(2026, 8, 1)),
  ];
  const submits = buildHeatmap(events, "submit", new Date(2026, 7, 1), new Date(2026, 7, 1));
  const passes = buildHeatmap(events, "pass", new Date(2026, 7, 1), new Date(2026, 7, 1));

  // 两个面板各自独立计数,不互相污染。
  assert.equal(submits.total, 1);
  assert.equal(passes.total, 1);
});

test("intensity scales relative to max and never returns 0 for real activity", () => {
  assert.equal(intensity(0, 10), 0);
  // 有活动就至少是 1 档 —— 否则做了题却显示成空白。
  assert.equal(intensity(1, 100), 1);
  assert.equal(intensity(1, 1), 1);
  assert.equal(intensity(10, 10), 4);
  assert.equal(intensity(5, 10), 2);
  assert.equal(intensity(8, 10), 4);
});

test("localDateKey uses local time, not the UTC prefix of the ISO string", () => {
  // 构造一个本地时间的当天,再确认 key 是那一天 —— 截 ISO 前 10 位在非 UTC 时区会错一天。
  const iso = at(2026, 8, 15, 23);
  assert.equal(localDateKey(iso), "2026-08-15");
});

test("trend accumulates passes and never decreases", () => {
  const points = buildTrend([
    event("pass", "lab-a", at(2026, 8, 1)),
    event("pass", "lab-b", at(2026, 8, 3)),
    event("pass", "lab-c", at(2026, 8, 3)),
    event("submit", "lab-d", at(2026, 8, 4)),
  ]);

  assert.deepEqual(points, [
    { date: "2026-08-01", cumulativePasses: 1 },
    { date: "2026-08-03", cumulativePasses: 3 },
  ]);
});

test("migration backfill pairs submit with pass on full score, sharing one timestamp", () => {
  const iso = at(2026, 8, 10);
  const events = backfillEvents({
    "lab-a": { history: [{ at: iso, verdict: "AC", score: 100, maxScore: 100 }] },
  });

  assert.equal(events.length, 2);
  assert.deepEqual(events.map((e) => e.kind), ["submit", "pass"]);
  // 共用同一个 at,才会落进 heatmap 的同一格。
  assert.equal(events[0].at, events[1].at);
});

test("migration backfill records only submit when not full score", () => {
  const events = backfillEvents({
    "lab-a": { history: [{ at: at(2026, 8, 10), verdict: "WA", score: 60, maxScore: 100 }] },
  });
  assert.deepEqual(events.map((e) => e.kind), ["submit"]);
});

test("migration backfill does not treat a compile error as a pass", () => {
  // CE 时 cases 为空、score 和 maxScore 都是 0。只比 score === maxScore
  // 会得出 0 === 0 为真,把编译失败算成通过 —— maxScore > 0 的 guard 挡住这个。
  const events = backfillEvents({
    "lab-a": { history: [{ at: at(2026, 8, 10), verdict: "AC", score: 0, maxScore: 0 }] },
  });
  assert.deepEqual(events.map((e) => e.kind), ["submit"]);
});

test("mock data is deterministic and shaped like real activity", () => {
  const end = new Date(2026, 8, 1);
  const a = mockEvents(180, end);
  const b = mockEvents(180, end);

  // 同一个 seed 必须给出同一份数据 —— 否则每次打开面板图都在变,
  // 就分不清看到的差别是样式改动还是随机波动。
  assert.deepEqual(a, b);
  assert.ok(a.length > 0, "应该生成事件");

  // 通过数必须少于提交数,否则两个 heatmap 面板看起来一样。
  const submits = a.filter((e) => e.kind === "submit").length;
  const passes = a.filter((e) => e.kind === "pass").length;
  assert.ok(passes < submits, `通过(${passes}) 应少于提交(${submits})`);

  // 必须有空白日子,否则 heatmap 糊成一片没有疏密对比。
  const days = new Set(a.map((e) => localDateKey(e.at)));
  assert.ok(days.size < 180, `应有空白日子,实际覆盖 ${days.size}/180 天`);

  // 趋势图至少要有两个点才画得出线。
  assert.ok(buildTrend(a).length >= 2);
});

test("chapter bars dispatch by lab type when checking passed", () => {
  const chapters = [
    {
      chapter: 1,
      chapterTitle: "线性表",
      labs: [
        { name: "prog-1", type: "program" as const },
        { name: "quiz-1", type: "quiz" as const },
      ],
    },
  ];
  // 只有代码题通过了 —— 如果实现忽略 type 去单张表查,选择题会被算错。
  const bars = buildChapterBars(chapters, (name, type) => type === "program" && name === "prog-1");
  assert.equal(bars[0].passed, 1);
  assert.equal(bars[0].total, 2);
});
