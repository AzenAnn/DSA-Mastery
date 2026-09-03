import assert from "node:assert/strict";
import test from "node:test";
import { projectProgressPassed, summarizeProjectSubmission } from "../src/projectProgress.ts";
import type { ProjectScoreResult } from "../src/cli";

test("project submission summaries preserve nested task results without long output", () => {
  const result: ProjectScoreResult = {
    target: "student",
    tasks: [
      {
        id: "matcher",
        kind: "stdio",
        status: "AC",
        score: 30,
        maxScore: 30,
        weight: 30,
        weightedScore: 30,
        judge: {
          target: "student",
          verdict: "AC",
          score: 30,
          maxScore: 30,
          cases: [{ id: "sample", tags: [], verdict: "AC", points: 30, maxPoints: 30, durationMs: 4, stderr: "" }],
          compilation: { ok: true, stdout: "", stderr: "" },
        },
      },
      {
        id: "report",
        kind: "manual",
        status: "PENDING",
        weight: 20,
        weightedScore: 0,
        checklist: ["实验报告"],
      },
    ],
    automatedScore: 30,
    automatedMax: 30,
    manualPending: 20,
    provisionalTotal: 30,
    total: 100,
    automatedFull: true,
    internalError: false,
  };

  const summary = summarizeProjectSubmission(result, "2026-09-02T00:00:00.000Z");

  assert.equal(summary.tasks[0]?.cases?.[0]?.id, "sample");
  assert.equal(summary.tasks[0]?.cases?.[0]?.verdict, "AC");
  assert.deepEqual(summary.tasks[1]?.checklist, ["实验报告"]);
  assert.equal("output" in (summary.tasks[0]?.cases?.[0] ?? {}), false);
});

test("automatic full score with manual weight remains pending instead of passed", () => {
  assert.equal(projectProgressPassed({ automatedFull: true, manualPending: 20, internalError: false }), false);
  assert.equal(projectProgressPassed({ automatedFull: true, manualPending: 0, internalError: false }), true);
  assert.equal(projectProgressPassed({ automatedFull: true, manualPending: 0, internalError: true }), false);
});
