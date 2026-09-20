import type { LabProgress } from "../src/progress.ts";
import { expect, it } from "vitest";
import { mergeLabProgress, mergeQuizProgress } from "../src/progressMerge.ts";

it("merges code progress without losing the latest submission or history", () => {
  const stable: LabProgress = {
    passed: false,
    bestScore: 60,
    maxScore: 100,
    submissionCount: 1,
    lastSubmission: {
      at: "2026-08-01T10:00:00.000Z",
      verdict: "WA",
      score: 60,
      maxScore: 100,
      cases: [],
    },
    history: [{
      id: "stable-submit",
      at: "2026-08-01T10:00:00.000Z",
      verdict: "WA",
      score: 60,
      maxScore: 100,
      snapshot: "submissions/01E01/stable-submit/main.cpp",
    }],
  };
  const legacy: LabProgress = {
    passed: true,
    firstPassedAt: "2026-08-02T10:00:00.000Z",
    bestScore: 100,
    maxScore: 100,
    submissionCount: 2,
    lastSubmission: {
      at: "2026-08-02T10:00:00.000Z",
      verdict: "AC",
      score: 100,
      maxScore: 100,
      cases: [],
    },
    history: [{
      id: "legacy-submit",
      at: "2026-08-02T10:00:00.000Z",
      verdict: "AC",
      score: 100,
      maxScore: 100,
      snapshot: "submissions/lab-01-06-sequential-list/legacy-submit/main.cpp",
    }],
  };

  const merged = mergeLabProgress(stable, legacy);

  expect(merged.passed).toBe(true);
  expect(merged.bestScore).toBe(100);
  expect(merged.submissionCount).toBe(2);
  expect(merged.lastSubmission?.verdict).toBe("AC");
  expect(merged.history.map((entry) => entry.id)).toStrictEqual(["legacy-submit", "stable-submit"]);
  expect(merged.history.map((entry) => entry.snapshot)).toStrictEqual([
    "submissions/lab-01-06-sequential-list/legacy-submit/main.cpp",
    "submissions/01E01/stable-submit/main.cpp",
  ]);
});

it("merges quiz answers by recency while keeping answers from both records", () => {
  const stable = {
    passed: false,
    bestScore: 1,
    maxScore: 2,
    answers: {
      q1: { selected: 0, correct: true, attempts: 1, answeredAt: "2026-08-02T10:00:00.000Z" },
    },
  };
  const legacy = {
    passed: true,
    bestScore: 2,
    maxScore: 2,
    answers: {
      q1: { selected: 1, correct: false, attempts: 3, answeredAt: "2026-08-01T10:00:00.000Z" },
      q2: { selected: 3, correct: true, attempts: 1, answeredAt: "2026-08-01T11:00:00.000Z" },
    },
  };

  const merged = mergeQuizProgress(stable, legacy);

  expect(merged.passed).toBe(true);
  expect(merged.bestScore).toBe(2);
  expect(merged.answers).toStrictEqual({
    q1: { selected: 0, correct: true, attempts: 1, answeredAt: "2026-08-02T10:00:00.000Z" },
    q2: { selected: 3, correct: true, attempts: 1, answeredAt: "2026-08-01T11:00:00.000Z" },
  });
});
