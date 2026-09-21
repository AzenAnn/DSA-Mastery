import type { JudgeResult } from "./judge.ts";
import type { CompareDifference, LoadedProgramLab } from "@dsa/lab-core";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { compareOutput, LabError, normalizeNewlines, runProcess } from "@dsa/lab-core";
import { compileTarget } from "../toolchain/compiler.ts";
import { judgeProgram } from "./judge.ts";

export interface ExpectedChange {
  id: string;
  expected: string;
  difference: CompareDifference;
  diff: string;
}

export interface RefreshResult {
  changed: number;
  written: number;
  changes: ExpectedChange[];
}

export interface VerifyResult {
  ok: boolean;
  checks: Record<string, boolean>;
  drift: RefreshResult;
  solution: JudgeResult;
  student: JudgeResult;
}

export function previewDiff(previous: string, next: string): string {
  const before = previous.replace(/\r\n?/g, "\n").split("\n");
  const after = next.replace(/\r\n?/g, "\n").split("\n");
  const lines: string[] = [];
  for (let index = 0; index < Math.max(before.length, after.length) && lines.length < 12; index += 1) {
    if (before[index] === after[index]) continue;
    lines.push(`@@ line ${index + 1} @@`);
    lines.push(`- ${before[index] ?? "<end of file>"}`);
    lines.push(`+ ${after[index] ?? "<end of file>"}`);
  }

  return lines.join("\n");
}

export async function refreshExpected(lab: LoadedProgramLab, write = false): Promise<RefreshResult> {
  if (!lab.manifest.targets.solution) throw new LabError("SOLUTION_UNAVAILABLE", "学生分发包不包含参考实现");
  const compilation = await compileTarget(lab, "solution");
  if (!compilation.ok)
    throw new LabError("SOLUTION_CE", `参考实现编译失败：\n${compilation.stderr || compilation.stdout}`);
  const changes: ExpectedChange[] = [];
  for (const testCase of lab.cases) {
    const input = await readFile(path.resolve(lab.labRoot, testCase.input), "utf8");
    const result = await runProcess(compilation.executable, [], {
      cwd: lab.labRoot,
      input,
      timeMs: testCase.timeMs ?? lab.manifest.judge.limits?.timeMs ?? 2000,
      outputKb: testCase.outputKb ?? lab.manifest.judge.limits?.outputKb ?? 1024,
    });
    if (result.spawnError || result.timedOut || result.outputExceeded || result.code !== 0) {
      const reason = result.timedOut ? "TLE" : result.outputExceeded ? "OLE" : "RE";
      throw new LabError("SOLUTION_FAILED", `参考实现未能生成 ${testCase.id}：${reason}`);
    }
    const expectedPath = path.resolve(lab.labRoot, testCase.expected);
    const previous = await readFile(expectedPath, "utf8");
    const normalizedOutput = normalizeNewlines(result.stdout);
    const comparison = compareOutput(previous, normalizedOutput, { mode: "exact" });
    if (!comparison.equal) {
      changes.push({
        id: testCase.id,
        expected: testCase.expected,
        difference: comparison.difference,
        diff: previewDiff(previous, normalizedOutput),
      });
      if (write) await writeFile(expectedPath, normalizedOutput, "utf8");
    }
  }

  return { changed: changes.length, written: write ? changes.length : 0, changes };
}

export async function verifyProgram(lab: LoadedProgramLab): Promise<VerifyResult> {
  const drift = await refreshExpected(lab, false);
  const solution = await judgeProgram(lab, { target: "solution" });
  const student = await judgeProgram(lab, { target: "student" });
  const checks = {
    expectedStable: drift.changed === 0,
    solutionFullScore: solution.score === 100 && solution.maxScore === 100,
    studentCompiles: student.verdict !== "CE",
    studentNotFullScore: student.score < student.maxScore,
  };

  return { ok: Object.values(checks).every(Boolean), checks, drift, solution, student };
}
