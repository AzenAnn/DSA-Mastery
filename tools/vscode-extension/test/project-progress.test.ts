import { expect, it } from "vitest";
import { projectProgressPassed, summarizeProjectSubmission } from "../src/projectProgress.ts";
import type { ProjectScoreResult } from "../src/cli";

it("project submission summaries preserve nested task results without long output", () => {
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

  expect(summary.tasks[0]?.cases?.[0]?.id).toBe("sample");
  expect(summary.tasks[0]?.cases?.[0]?.verdict).toBe("AC");
  expect(summary.tasks[1]?.checklist).toStrictEqual(["实验报告"]);
  expect("output" in (summary.tasks[0]?.cases?.[0] ?? {})).toBe(false);
});

it("automatic full score with manual weight remains pending instead of passed", () => {
  expect(projectProgressPassed({ automatedFull: true, manualPending: 20, internalError: false })).toBe(false);
  expect(projectProgressPassed({ automatedFull: true, manualPending: 0, internalError: false })).toBe(true);
  expect(projectProgressPassed({ automatedFull: true, manualPending: 0, internalError: true })).toBe(false);
});

it("historical full score cannot override unknown, unassessed or stale current code", () => {
  const history = { automatedFull: true, manualPending: 0, internalError: false };
  expect(projectProgressPassed({ ...history, currentUnknown: true })).toBe(false);
  expect(projectProgressPassed({ ...history, current: {
    tasks: [], automatedScore: 0, automatedMax: 100, manualPending: 0,
    provisionalTotal: 0, total: 100, automatedFull: false, internalError: false, complete: false,
  } })).toBe(false);
});
