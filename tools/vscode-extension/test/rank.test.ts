import test from "node:test";
import assert from "node:assert/strict";
import { RANKS, getNextRank, getRankBySolvedCount, getRankProgress } from "../src/rank.ts";
import { countActivity, type ActivityEvent } from "../src/stats.ts";

test("rank configuration supplies eight named, contiguous ranges and theme color tokens", () => {
  assert.deepEqual(RANKS.map(({ id, name, zhName, minSolved, maxSolved }) => ({ id, name, zhName, minSolved, maxSolved })), [
    { id: "trainee", name: "Trainee", zhName: "训练者", minSolved: 0, maxSolved: 9 },
    { id: "pupil", name: "Pupil", zhName: "学徒", minSolved: 10, maxSolved: 29 },
    { id: "specialist", name: "Specialist", zhName: "专精者", minSolved: 30, maxSolved: 59 },
    { id: "expert", name: "Expert", zhName: "专家", minSolved: 60, maxSolved: 99 },
    { id: "candidate-master", name: "Candidate Master", zhName: "候选大师", minSolved: 100, maxSolved: 149 },
    { id: "master", name: "Master", zhName: "大师", minSolved: 150, maxSolved: 199 },
    { id: "grandmaster", name: "Grandmaster", zhName: "宗师", minSolved: 200, maxSolved: 249 },
    { id: "legendary", name: "Legendary", zhName: "传奇", minSolved: 250, maxSolved: undefined },
  ]);
  for (const rank of RANKS) {
    assert.match(rank.color, new RegExp(`^var\\(--rank-${rank.id}, #[0-9A-Fa-f]{6}\\)$`));
  }
});

const boundaries: [number, string][] = [
  [0, "Trainee"], [1, "Trainee"], [9, "Trainee"],
  [10, "Pupil"], [11, "Pupil"], [29, "Pupil"],
  [30, "Specialist"], [31, "Specialist"], [59, "Specialist"],
  [60, "Expert"], [61, "Expert"], [99, "Expert"],
  [100, "Candidate Master"], [101, "Candidate Master"], [149, "Candidate Master"],
  [150, "Master"], [151, "Master"], [199, "Master"],
  [200, "Grandmaster"], [201, "Grandmaster"], [249, "Grandmaster"],
  [250, "Legendary"], [251, "Legendary"], [1000, "Legendary"],
  [Number.MAX_VALUE, "Legendary"],
];

for (const [solved, name] of boundaries) {
  test(`${solved} solved belongs to ${name}`, () => {
    assert.equal(getRankBySolvedCount(solved).name, name);
    assert.equal(getRankProgress(solved).rank.name, name);
  });
}

test("next rank follows the configured order and accepts the same rank by stable id", () => {
  assert.deepEqual(RANKS.map((rank) => getNextRank({ ...rank })?.name), [
    "Pupil", "Specialist", "Expert", "Candidate Master", "Master", "Grandmaster", "Legendary", undefined,
  ]);
  assert.equal(getNextRank({ ...RANKS[0], id: "unknown" }), undefined);
});

test("progress is relative to the current rank and resets on promotion", () => {
  const cases: [number, number, number, string][] = [
    [0, 0, 10, "Pupil"],
    [9, 90, 1, "Pupil"],
    [10, 0, 20, "Specialist"],
    [14, 20, 16, "Specialist"],
    [20, 50, 10, "Specialist"],
    [29, 95, 1, "Specialist"],
    [30, 0, 30, "Expert"],
    [45, 50, 15, "Expert"],
    [59, 96.66666666666667, 1, "Expert"],
    [60, 0, 40, "Candidate Master"],
    [80, 50, 20, "Candidate Master"],
    [99, 97.5, 1, "Candidate Master"],
    [100, 0, 50, "Master"],
    [125, 50, 25, "Master"],
    [149, 98, 1, "Master"],
    [150, 0, 50, "Grandmaster"],
    [175, 50, 25, "Grandmaster"],
    [199, 98, 1, "Grandmaster"],
    [200, 0, 50, "Legendary"],
    [225, 50, 25, "Legendary"],
    [249, 98, 1, "Legendary"],
  ];
  for (const [solved, expectedProgress, remaining, nextName] of cases) {
    const progress = getRankProgress(solved);
    assert.equal(progress.solvedCount, solved);
    assert.ok(Math.abs(progress.progress - expectedProgress) < 1e-10, `${solved} solved progress`);
    assert.equal(progress.remaining, remaining, `${solved} solved remaining`);
    assert.equal(progress.nextRank?.name, nextName, `${solved} solved next rank`);
  }
});

test("Legendary remains complete without a next rank at and above the maximum threshold", () => {
  for (const solved of [250, 251, 1000, Number.MAX_VALUE]) {
    const progress = getRankProgress(solved);
    assert.equal(progress.rank.name, "Legendary");
    assert.equal(progress.solvedCount, solved);
    assert.equal(progress.progress, 100);
    assert.equal(progress.remaining, 0);
    assert.equal(Object.hasOwn(progress, "nextRank"), false);
  }
});

test("invalid numeric counts become zero and nonnegative finite fractions truncate", () => {
  for (const solved of [NaN, Infinity, -Infinity, -100, -0.1, -0]) {
    assert.deepEqual(getRankProgress(solved), getRankProgress(0));
    assert.equal(getRankBySolvedCount(solved), RANKS[0]);
  }
  for (const [fraction, integer] of [[0.9, 0], [9.99, 9], [10.9, 10], [29.99, 29], [249.99, 249], [250.99, 250]]) {
    assert.deepEqual(getRankProgress(fraction), getRankProgress(integer));
    assert.equal(getRankBySolvedCount(fraction), getRankBySolvedCount(integer));
  }
});

test("repeated submissions and passes cannot promote a rank until another distinct lab is solved", () => {
  const at = new Date(2026, 8, 12, 12).toISOString();
  const labTypes = ["program", "quiz", "project"] as const;
  const events: ActivityEvent[] = Array.from({ length: 29 }, (_, index) => ({
    at, kind: "pass", labName: `solved-${index}`, labType: labTypes[index % labTypes.length],
  }));
  const before = getRankProgress(countActivity(events).labsPassed);
  for (let repeat = 0; repeat < 300; repeat += 1) {
    events.push({ at, kind: "submit", labName: "solved-0", labType: "program" });
    events.push({ at, kind: "pass", labName: "solved-0", labType: "program" });
  }
  events.push({ at, kind: "submit", labName: "new-lab", labType: "project" });
  assert.deepEqual(countActivity(events), { submissions: 301, passes: 329, labsAttempted: 30, labsPassed: 29 });
  assert.deepEqual(getRankProgress(countActivity(events).labsPassed), before);
  assert.equal(before.rank.name, "Pupil");
  assert.equal(before.progress, 95);

  events.push({ at, kind: "pass", labName: "new-lab", labType: "project" });
  const promoted = getRankProgress(countActivity(events).labsPassed);
  assert.equal(promoted.rank.name, "Specialist");
  assert.equal(promoted.progress, 0);
  assert.equal(promoted.remaining, 30);
});
