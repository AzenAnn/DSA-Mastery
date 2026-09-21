import type { ActivityEvent } from "../src/progress/stats.ts";
import { expect, it } from "vitest";
import { RANKS, getNextRank, getRankBySolvedCount, getRankProgress } from "../src/progress/rank.ts";
import { countActivity } from "../src/progress/stats.ts";

it("每个段位区间的上下边界都归属正确", () => {
  for (const rank of RANKS) {
    expect(getRankBySolvedCount(rank.minSolved).id, `${rank.id} 下界`).toBe(rank.id);
    if (rank.maxSolved !== undefined) {
      expect(getRankBySolvedCount(rank.maxSolved).id, `${rank.id} 上界`).toBe(rank.id);
      expect(getRankBySolvedCount(rank.maxSolved + 1).id, `${rank.id} 上界 +1`).not.toBe(rank.id);
    }
  }
});

it("非正整数的题数一律按 0 处理，小数向下取整", () => {
  for (const solved of [Number.NaN, Infinity, -Infinity, -100, -0.1]) {
    expect(getRankProgress(solved)).toStrictEqual(getRankProgress(0));
  }
  expect(getRankBySolvedCount(29.99).id).toBe("pupil");
});

it("进度相对当前段位计算，晋级后归零", () => {
  expect(getRankProgress(10)).toMatchObject({ progress: 0, remaining: 20, nextRank: { id: "specialist" } });
  expect(getRankProgress(20)).toMatchObject({ progress: 50, remaining: 10, nextRank: { id: "specialist" } });
  expect(getRankProgress(29)).toMatchObject({ progress: 95, remaining: 1, nextRank: { id: "specialist" } });
  expect(getRankProgress(30)).toMatchObject({ progress: 0, remaining: 30, nextRank: { id: "expert" } });
});

it("最高段位没有下一段，进度恒为满", () => {
  expect(getNextRank(RANKS.at(-1)!)).toBe(undefined);
  const progress = getRankProgress(1000);
  expect(progress.rank.id).toBe("legendary");
  expect(progress).toMatchObject({ progress: 100, remaining: 0 });
  expect(Object.hasOwn(progress, "nextRank")).toBe(false);
});

it("重复提交同一道题不会晋级，解出新题才会", () => {
  const at = new Date(2026, 8, 12, 12).toISOString();
  const labTypes = ["program", "quiz", "project"] as const;
  const events: ActivityEvent[] = Array.from({ length: 29 }, (_, index) => ({
    at,
    kind: "pass",
    labName: `solved-${index}`,
    labType: labTypes[index % labTypes.length],
  }));
  const before = getRankProgress(countActivity(events).labsPassed);
  for (let repeat = 0; repeat < 300; repeat += 1) {
    events.push({ at, kind: "submit", labName: "solved-0", labType: "program" });
    events.push({ at, kind: "pass", labName: "solved-0", labType: "program" });
  }
  events.push({ at, kind: "submit", labName: "new-lab", labType: "project" });
  expect(countActivity(events)).toStrictEqual({ submissions: 301, passes: 329, labsAttempted: 30, labsPassed: 29 });
  expect(getRankProgress(countActivity(events).labsPassed)).toStrictEqual(before);
  expect(before.rank.id).toBe("pupil");

  events.push({ at, kind: "pass", labName: "new-lab", labType: "project" });
  expect(getRankProgress(countActivity(events).labsPassed)).toMatchObject({
    rank: { id: "specialist" },
    progress: 0,
    remaining: 30,
  });
});
