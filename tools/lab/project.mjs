import path from "node:path";
import { LabError } from "./errors.mjs";
import { judgeProgram, runInteractive } from "./judge.mjs";
import { refreshExpected } from "./operations.mjs";
import { runProcess } from "./process.mjs";

function programView(lab, task) {
  return {
    labRoot: task.taskPath,
    manifest: {
      schemaVersion: 1,
      type: "program",
      language: "cpp",
      toolchain: lab.manifest.toolchain,
      targets: task.config.targets,
      judge: task.config.judge,
    },
    cases: task.cases,
  };
}

function selectedTasks(lab, taskId) {
  if (!taskId) return lab.tasks;
  const selected = lab.tasks.filter((task) => task.id === taskId);
  if (!selected.length) throw new LabError("TASK_NOT_FOUND", `不存在 Project task：${taskId}`);
  return selected;
}

export async function buildProject(lab, target = "student") {
  if (lab.manifest.type !== "project") throw new LabError("TYPE_UNSUPPORTED", "CMake build 仅支持 project Lab");
  if (!new Set(["student", "solution"]).has(target)) throw new LabError("TARGET_INVALID", "Project target 必须是 student 或 solution");
  const configure = await runProcess("cmake", [
    "--preset",
    target,
    `-DCMAKE_CXX_STANDARD=${cmakeStandardNumber(lab.manifest.toolchain.standard)}`,
    "-DCMAKE_CXX_STANDARD_REQUIRED=ON",
    "-DCMAKE_CXX_EXTENSIONS=OFF",
  ], { cwd: lab.labRoot, timeMs: 60_000, outputKb: 4096 });
  if (configure.spawnError) throw new LabError("CMAKE_NOT_FOUND", "无法启动 CMake；Project Lab 需要 CMake >= 3.25");
  if (configure.code !== 0 || configure.timedOut || configure.outputExceeded) {
    return { ok: false, phase: "configure", target, configure };
  }
  const build = await runProcess("cmake", ["--build", "--preset", target, "--config", "Release"], { cwd: lab.labRoot, timeMs: 120_000, outputKb: 8192 });
  return { ok: build.code === 0 && !build.timedOut && !build.outputExceeded, phase: "build", target, configure, build };
}

export function cmakeStandardNumber(standard) {
  if (standard === "c++17") return "17";
  if (standard === "c++20") return "20";
  throw new LabError("TOOLCHAIN_STANDARD", `Project 不支持 C++ 标准：${standard}`);
}

async function scoreCtest(lab, task, target, build) {
  if (!build.ok) {
    return {
      id: task.id,
      kind: task.kind,
      status: "CE",
      score: 0,
      maxScore: 100,
      weight: task.weight,
      weightedScore: 0,
      tests: [],
      build,
    };
  }
  const binaryDir = path.join(lab.labRoot, ".lab-cache", "cmake", target);
  const tests = [];
  for (const test of task.config.ctest.tests) {
    const expression = `^${test.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;
    const result = await runProcess("ctest", ["--test-dir", binaryDir, "-C", "Release", "-R", expression, "--no-tests=error", "--output-on-failure"], {
      cwd: lab.labRoot,
      timeMs: 60_000,
      outputKb: 4096,
    });
    const verdict = classifyCtestExecution(result);
    tests.push({ name: test.name, verdict, points: verdict === "AC" ? test.points : 0, maxPoints: test.points, durationMs: result.durationMs, output: `${result.stdout}\n${result.stderr}`.trim() });
  }
  const score = tests.reduce((total, test) => total + test.points, 0);
  return {
    id: task.id,
    kind: task.kind,
    status: tests.every((test) => test.verdict === "AC") ? "AC" : tests.find((test) => test.verdict !== "AC")?.verdict,
    score,
    maxScore: 100,
    weight: task.weight,
    weightedScore: score * task.weight / 100,
    tests,
  };
}

export function classifyCtestExecution(result) {
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.spawnError || /No tests were found/i.test(output)) return "IE";
  if (result.outputExceeded) return "OLE";
  if (result.timedOut) return "TLE";
  return result.code === 0 ? "AC" : "WA";
}

export async function scoreProject(lab, options = {}) {
  if (lab.manifest.type !== "project") throw new LabError("TYPE_UNSUPPORTED", "Project 评分仅支持 project Lab");
  const target = options.target ?? "student";
  const tasks = selectedTasks(lab, options.taskId);
  let cmakeBuild;
  if (tasks.some((task) => task.kind === "ctest")) cmakeBuild = await buildProject(lab, target);
  const results = [];
  for (const task of tasks) {
    if (task.kind === "manual") {
      results.push({ id: task.id, kind: task.kind, status: "PENDING", weight: task.weight, weightedScore: 0, checklist: task.config.checklist });
    } else if (task.kind === "stdio") {
      const judged = await judgeProgram(programView(lab, task), { target, caseId: options.caseId });
      results.push({
        id: task.id,
        kind: task.kind,
        status: judged.verdict,
        score: judged.score,
        maxScore: judged.maxScore,
        weight: task.weight,
        weightedScore: judged.maxScore ? judged.score / judged.maxScore * task.weight : 0,
        judge: judged,
      });
    } else {
      results.push(await scoreCtest(lab, task, target, cmakeBuild));
    }
  }
  const automated = results.filter((task) => task.kind !== "manual");
  const manual = results.filter((task) => task.kind === "manual");
  const automatedScore = automated.reduce((total, task) => total + task.weightedScore, 0);
  const automatedMax = automated.reduce((total, task) => total + task.weight, 0);
  const manualPending = manual.reduce((total, task) => total + task.weight, 0);
  const internalError = projectHasInternalError(results);
  return {
    target,
    tasks: results,
    automatedScore,
    automatedMax,
    manualPending,
    provisionalTotal: automatedScore,
    total: 100,
    automatedFull: automatedScore === automatedMax,
    internalError,
  };
}

export function projectHasInternalError(results) {
  return results.some((task) =>
    task.status === "IE" ||
    task.judge?.cases?.some((testCase) => testCase.verdict === "IE") ||
    task.tests?.some((testCase) => testCase.verdict === "IE"),
  );
}

export async function refreshProjectExpected(lab, options = {}) {
  if (lab.manifest.type !== "project") throw new LabError("TYPE_UNSUPPORTED", "Project 参考输出刷新只支持 project Lab");
  const selected = selectedTasks(lab, options.taskId);
  const stdioTasks = selected.filter((task) => task.kind === "stdio");
  if (stdioTasks.length === 0) {
    throw new LabError("TYPE_UNSUPPORTED", options.taskId
      ? `task ${options.taskId} 不是 stdio task，不能刷新 .out`
      : "当前 Project 没有可刷新 .out 的 stdio task");
  }
  const tasks = [];
  for (const task of stdioTasks) {
    tasks.push({ id: task.id, refresh: await refreshExpected(programView(lab, task), Boolean(options.write)) });
  }
  return {
    changed: tasks.reduce((total, task) => total + task.refresh.changed, 0),
    written: tasks.reduce((total, task) => total + task.refresh.written, 0),
    tasks,
  };
}

export async function interactiveProjectTask(lab, taskId, target = "student") {
  const [task] = selectedTasks(lab, taskId);
  if (task.kind !== "stdio") throw new LabError("TYPE_UNSUPPORTED", "interactive 只支持 stdio task");
  return runInteractive(programView(lab, task), target);
}

export async function verifyProject(lab) {
  const drift = await refreshProjectExpected(lab, { write: false }).catch((error) => {
    if (error?.code === "TYPE_UNSUPPORTED") return { changed: 0, written: 0, tasks: [] };
    throw error;
  });
  const solution = await scoreProject(lab, { target: "solution" });
  const student = await scoreProject(lab, { target: "student" });
  const checks = {
    solutionAutomatedFull: solution.automatedFull,
    studentNotFull: !student.automatedFull,
    weightsTotal100: solution.automatedMax + solution.manualPending === 100,
    expectedStable: drift.changed === 0,
  };
  return { ok: Object.values(checks).every(Boolean), checks, drift, solution, student };
}

export function formatProject(result) {
  const lines = ["TASK                 KIND      RESULT    SCORE"];
  for (const task of result.tasks) {
    const score = task.kind === "manual" ? `PENDING / ${task.weight}` : `${task.weightedScore}/${task.weight}`;
    lines.push(`${task.id.padEnd(20)} ${task.kind.padEnd(9)} ${task.status.padEnd(9)} ${score}`);
    if (task.judge) {
      for (const item of task.judge.cases) lines.push(`  ${item.id}: ${item.verdict} ${item.points}/${item.maxPoints}`);
    }
    if (task.tests) {
      for (const test of task.tests) lines.push(`  ${test.name}: ${test.verdict} ${test.points}/${test.maxPoints}`);
    }
  }
  lines.push("".padEnd(46, "-"));
  lines.push(`Automated: ${result.automatedScore}/${result.automatedMax}`);
  lines.push(`Manual pending: ${result.manualPending}`);
  lines.push(`Provisional total: ${result.provisionalTotal}/100`);
  return lines.join("\n");
}
