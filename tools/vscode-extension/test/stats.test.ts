import { expect, it } from "vitest";
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

function event(kind: "submit" | "pass", labName: string, iso: string, labType: "program" | "quiz" | "project" = "program"): ActivityEvent {
  return { at: iso, kind, labName, labType };
}

it("counts submissions, passes and distinct labs separately", () => {
  const events = [
    event("submit", "lab-a", at(2026, 8, 1)),
    event("submit", "lab-a", at(2026, 8, 1)),
    event("pass", "lab-a", at(2026, 8, 1)),
    event("submit", "lab-b", at(2026, 8, 2)),
  ];

  const counters = countActivity(events);
  expect(counters.submissions).toBe(3);
  expect(counters.passes).toBe(1);
  // 两道不同的题被提交过,不是 3 次提交 = 3 道题。
  expect(counters.labsAttempted).toBe(2);
  expect(counters.labsPassed).toBe(1);
});

it("counts a lab as attempted even when only a pass event survived backfill", () => {
  // 迁移回填可能只留下 pass(history 被裁剪),这时仍要算作提交过。
  const counters = countActivity([event("pass", "lab-only-pass", at(2026, 7, 1))]);
  expect(counters.labsAttempted).toBe(1);
  expect(counters.labsPassed).toBe(1);
});

it("heatmap fills every day in range including empty ones", () => {
  const map = buildHeatmap(
    [event("submit", "lab-a", at(2026, 8, 3))],
    "submit",
    new Date(2026, 7, 1),
    new Date(2026, 7, 5),
  );

  // 8/1 到 8/5 共 5 天,没活动的日子必须是 level 0 的格子,不能跳过。
  expect(map.cells.length).toBe(5);
  expect(map.cells.map((c) => c.date)).toStrictEqual([
    "2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05",
  ]);
  expect(map.cells[2].count).toBe(1);
  expect(map.cells[0].count).toBe(0);
  expect(map.cells[0].level).toBe(0);
  expect(map.total).toBe(1);
});

it("heatmap counts only the requested kind", () => {
  const events = [
    event("submit", "lab-a", at(2026, 8, 1)),
    event("pass", "lab-a", at(2026, 8, 1)),
  ];
  const submits = buildHeatmap(events, "submit", new Date(2026, 7, 1), new Date(2026, 7, 1));
  const passes = buildHeatmap(events, "pass", new Date(2026, 7, 1), new Date(2026, 7, 1));

  // 两个面板各自独立计数,不互相污染。
  expect(submits.total).toBe(1);
  expect(passes.total).toBe(1);
});

it("intensity scales relative to max and never returns 0 for real activity", () => {
  expect(intensity(0, 10)).toBe(0);
  // 有活动就至少是 1 档 —— 否则做了题却显示成空白。
  expect(intensity(1, 100)).toBe(1);
  expect(intensity(1, 1)).toBe(1);
  expect(intensity(10, 10)).toBe(4);
  expect(intensity(5, 10)).toBe(2);
  expect(intensity(8, 10)).toBe(4);
});

it("localDateKey uses local time, not the UTC prefix of the ISO string", () => {
  // 构造一个本地时间的当天,再确认 key 是那一天 —— 截 ISO 前 10 位在非 UTC 时区会错一天。
  const iso = at(2026, 8, 15, 23);
  expect(localDateKey(iso)).toBe("2026-08-15");
});

it("trend accumulates passes and never decreases", () => {
  const points = buildTrend([
    event("pass", "lab-a", at(2026, 8, 1)),
    event("pass", "lab-b", at(2026, 8, 3)),
    event("pass", "lab-c", at(2026, 8, 3)),
    event("submit", "lab-d", at(2026, 8, 4)),
  ]);

  expect(points).toStrictEqual([
    { date: "2026-08-01", cumulativePasses: 1 },
    { date: "2026-08-03", cumulativePasses: 3 },
  ]);
});

it("migration backfill pairs submit with pass on full score, sharing one timestamp", () => {
  const iso = at(2026, 8, 10);
  const events = backfillEvents({
    "lab-a": { history: [{ at: iso, verdict: "AC", score: 100, maxScore: 100 }] },
  });

  expect(events.length).toBe(2);
  expect(events.map((e) => e.kind)).toStrictEqual(["submit", "pass"]);
  // 共用同一个 at,才会落进 heatmap 的同一格。
  expect(events[0].at).toBe(events[1].at);
});

it("migration backfill records only submit when not full score", () => {
  const events = backfillEvents({
    "lab-a": { history: [{ at: at(2026, 8, 10), verdict: "WA", score: 60, maxScore: 100 }] },
  });
  expect(events.map((e) => e.kind)).toStrictEqual(["submit"]);
});

it("migration backfill does not treat a compile error as a pass", () => {
  // CE 时 cases 为空、score 和 maxScore 都是 0。只比 score === maxScore
  // 会得出 0 === 0 为真,把编译失败算成通过 —— maxScore > 0 的 guard 挡住这个。
  const events = backfillEvents({
    "lab-a": { history: [{ at: at(2026, 8, 10), verdict: "AC", score: 0, maxScore: 0 }] },
  });
  expect(events.map((e) => e.kind)).toStrictEqual(["submit"]);
});

it("mock data is deterministic and shaped like real activity", () => {
  const end = new Date(2026, 8, 1);
  const a = mockEvents(180, end);
  const b = mockEvents(180, end);

  // 同一个 seed 必须给出同一份数据 —— 否则每次打开面板图都在变,
  // 就分不清看到的差别是样式改动还是随机波动。
  expect(a).toStrictEqual(b);
  expect(a.length > 0, "应该生成事件").toBeTruthy();

  // 通过数必须少于提交数,否则两个 heatmap 面板看起来一样。
  const submits = a.filter((e) => e.kind === "submit").length;
  const passes = a.filter((e) => e.kind === "pass").length;
  expect(passes < submits, `通过(${passes}) 应少于提交(${submits})`).toBeTruthy();

  // 必须有空白日子,否则 heatmap 糊成一片没有疏密对比。
  const days = new Set(a.map((e) => localDateKey(e.at)));
  expect(days.size < 180, `应有空白日子,实际覆盖 ${days.size}/180 天`).toBeTruthy();

  // 趋势图至少要有两个点才画得出线。
  expect(buildTrend(a).length >= 2).toBeTruthy();
});

it("chapter bars dispatch by lab type when checking passed", () => {
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
  expect(bars[0].passed).toBe(1);
  expect(bars[0].total).toBe(2);
});

it("chapter bars keep Project in the same type-aware completion flow", () => {
  const chapters = [{
    chapter: 3,
    chapterTitle: "字符串",
    labs: [{ name: "project-1", type: "project" as const }],
  }];
  const bars = buildChapterBars(chapters, (name, type) => type === "project" && name === "project-1");
  expect(bars[0]).toStrictEqual({ chapter: 3, chapterTitle: "字符串", passed: 1, total: 1 });
});
