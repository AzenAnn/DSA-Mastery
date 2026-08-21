import { readFile } from "node:fs/promises";
import path from "node:path";
import { compareOutput } from "./compare.mjs";
import { compileTarget } from "./compiler.mjs";
import { LabError } from "./errors.mjs";
import { runProcess } from "./process.mjs";
import { cleanTerminalText, createTheme, quoteCommandArg } from "./terminal.mjs";

function limitsFor(manifest, testCase) {
  return {
    timeMs: testCase.timeMs ?? manifest.judge.limits?.timeMs ?? 2000,
    outputKb: testCase.outputKb ?? manifest.judge.limits?.outputKb ?? 1024,
  };
}

function compareFor(manifest, testCase) {
  return { mode: "tokens", ...manifest.judge.compare, ...testCase.compare };
}

export function classifyExecution(execution, expected, compareConfig) {
  if (execution.spawnError) return { verdict: "IE" };
  if (execution.outputExceeded) return { verdict: "OLE" };
  if (execution.timedOut) return { verdict: "TLE" };
  if (execution.code !== 0) return { verdict: "RE" };
  const comparison = compareOutput(expected, execution.stdout, compareConfig);
  return { verdict: comparison.equal ? "AC" : "WA", comparison };
}

export async function judgeProgram(lab, options = {}) {
  if (lab.manifest.type !== "program") throw new LabError("TYPE_UNSUPPORTED", "stdio 评分仅支持 program Lab");
  const target = options.target ?? "student";
  const compilation = await compileTarget(lab, target);
  if (!compilation.ok) {
    return {
      target,
      verdict: "CE",
      score: 0,
      maxScore: 100,
      compilation,
      cases: [],
    };
  }
  const selected = options.caseId ? lab.cases.filter((item) => item.id === options.caseId) : lab.cases;
  if (options.caseId && selected.length === 0) throw new LabError("CASE_NOT_FOUND", `不存在测试用例：${options.caseId}`);
  const results = [];
  for (const testCase of selected) {
    const [input, expected] = await Promise.all([
      readFile(path.resolve(lab.labRoot, testCase.input), "utf8"),
      readFile(path.resolve(lab.labRoot, testCase.expected), "utf8"),
    ]);
    const limits = limitsFor(lab.manifest, testCase);
    const execution = await runProcess(compilation.executable, [], {
      cwd: lab.labRoot,
      input,
      ...limits,
    });
    const classification = classifyExecution(execution, expected, compareFor(lab.manifest, testCase));
    const { verdict, comparison } = classification;
    results.push({
      id: testCase.id,
      tags: testCase.tags ?? [],
      verdict,
      points: verdict === "AC" ? testCase.points : 0,
      maxPoints: testCase.points,
      durationMs: execution.durationMs,
      stderr: execution.stderr,
      comparison,
    });
  }
  const score = results.reduce((total, result) => total + result.points, 0);
  const maxScore = results.reduce((total, result) => total + result.maxPoints, 0);
  return {
    target,
    verdict: results.every((result) => result.verdict === "AC") ? "AC" : results.find((result) => result.verdict !== "AC")?.verdict,
    score,
    maxScore,
    compilation,
    cases: results,
  };
}

export async function runInteractive(lab, target = "student") {
  const compilation = await compileTarget(lab, target);
  if (!compilation.ok) return { verdict: "CE", compilation, code: 1 };
  const execution = await runProcess(compilation.executable, [], { cwd: lab.labRoot, inherit: true });
  return { verdict: execution.code === 0 ? "AC" : "RE", compilation, execution, code: execution.code ?? 1 };
}

function retryCommand(command, labPath, taskId, caseId) {
  if (!labPath || !caseId) return undefined;
  const parts = [command, "--", quoteCommandArg(labPath)];
  if (taskId) parts.push("--task", quoteCommandArg(taskId));
  parts.push("--case", quoteCommandArg(caseId));
  return parts.join(" ");
}

function differenceLocation(difference) {
  return difference.kind === "token"
    ? `第 ${difference.index} 个 token`
    : `第 ${difference.line} 行第 ${difference.column} 列`;
}

export function formatJudge(result, options = {}) {
  const theme = options.theme ?? createTheme({ color: false });
  if (result.verdict === "CE") {
    const diagnostic = cleanTerminalText(result.compilation.stderr || result.compilation.stdout).trim();
    return [
      `${theme.danger("COMPILE ERROR")} ${theme.verdict("CE")}`,
      diagnostic && theme.heading("诊断"),
      diagnostic,
    ].filter(Boolean).join("\n");
  }
  const caseWidth = Math.max(20, ...result.cases.map((item) => item.id.length));
  const rows = [
    `${theme.cell("CASE", caseWidth, theme.muted)} ${theme.cell("RESULT", 8, theme.muted)} ${theme.cell("TIME", 10, theme.muted)} ${theme.muted("SCORE")}`,
  ];
  for (const item of result.cases) {
    rows.push(`${theme.cell(item.id, caseWidth)} ${theme.cell(item.verdict, 8, theme.verdict)} ${theme.cell(`${Math.round(item.durationMs)} ms`, 10, theme.muted)} ${theme.score(item.points, item.maxPoints)}`);
    if (item.comparison && !item.comparison.equal) {
      const difference = item.comparison.difference;
      rows.push(
        `  ${theme.heading("首处差异：")}${differenceLocation(difference)}`,
        `  ${theme.muted("期望：")} ${JSON.stringify(difference.expected)}`,
        `  ${theme.muted("实际：")} ${JSON.stringify(difference.actual)}`,
      );
    }
    if (item.stderr) rows.push(`  ${theme.heading("stderr")}`, cleanTerminalText(item.stderr).trim().slice(0, 500));
  }
  const passedCases = result.cases.filter((item) => item.verdict === "AC").length;
  const totalDuration = result.cases.reduce((total, item) => total + item.durationMs, 0);
  const full = result.score === result.maxScore && passedCases === result.cases.length;
  rows.push(theme.separator(Math.max(56, caseWidth + 37)));
  rows.push(`${theme.status(full ? "PASS" : "NOT FULL")}  ${passedCases}/${result.cases.length} cases · ${theme.score(result.score, result.maxScore)} · ${theme.muted(`${Math.round(totalDuration)} ms`)}`);
  const firstFailure = result.cases.find((item) => item.verdict !== "AC");
  const retry = retryCommand(options.command ?? "pnpm lab:run", options.labPath, options.taskId, firstFailure?.id);
  if (retry) rows.push(`${theme.heading("Retry：")} ${theme.command(retry)}`);
  return rows.join("\n");
}
