import assert from "node:assert/strict";
import test from "node:test";
import { mergeLabProgress, mergeQuizProgress } from "../src/progressMerge.ts";

test("merges code progress without losing the latest submission or history", () => {
  const stable = {
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
  const legacy = {
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

  assert.equal(merged.passed, true);
  assert.equal(merged.bestScore, 100);
  assert.equal(merged.submissionCount, 2);
  assert.equal(merged.lastSubmission?.verdict, "AC");
  assert.deepEqual(merged.history.map((entry) => entry.id), ["legacy-submit", "stable-submit"]);
  assert.deepEqual(merged.history.map((entry) => entry.snapshot), [
    "submissions/lab-01-06-sequential-list/legacy-submit/main.cpp",
    "submissions/01E01/stable-submit/main.cpp",
  ]);
});

test("merges quiz answers by recency while keeping answers from both records", () => {
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

  assert.equal(merged.passed, true);
  assert.equal(merged.bestScore, 2);
  assert.deepEqual(merged.answers, {
    q1: { selected: 0, correct: true, attempts: 1, answeredAt: "2026-08-02T10:00:00.000Z" },
    q2: { selected: 3, correct: true, attempts: 1, answeredAt: "2026-08-01T11:00:00.000Z" },
  });
});
