import type { RefreshResult } from "../program/expected.ts";
import type { CaseResult, JudgeableLab, JudgeResult, InteractiveResult, Verdict } from "../program/judge.ts";
import type { ProjectEnvironment } from "../toolchain/windows.ts";
import type { CurrentProject } from "./state.ts";
import type { CaptureResult, LoadedProjectLab, ProjectTask, TargetName, TaskKind, Theme } from "@dsa/lab-core";
import { rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { cleanTerminalText, createTheme, LabError, quoteCommandArg, runProcess } from "@dsa/lab-core";
import { refreshExpected } from "../program/expected.ts";
import { judgeProgram, runInteractive } from "../program/judge.ts";
import { createMinGwEnvironment, createMsvcEnvironment } from "../toolchain/windows.ts";
import {
  currentProject,
  dependencyClosure,
  projectInputs,
  readProjectState,
  withProjectLock,
  writeProjectState,
} from "./state.ts";

export type TaskStatus = Verdict | "BLOCKED";

interface BuildState {
  ok: boolean;
  phase: "configure" | "build";
  target: TargetName;
  configure: CaptureResult;
  environment?: ProjectEnvironment | undefined;
  cleaned?: boolean | undefined;
  build?: CaptureResult | undefined;
  targets?: string[] | undefined;
  scope?: "project" | "task" | undefined;
  legacyBuild?: boolean | undefined;
  blockedBy?: string[] | undefined;
  relatedTasks?: string[] | undefined;
}

export type PublicBuild = Omit<BuildState, "environment" | "cleaned">;

export interface CtestResult {
  name: string;
  verdict: Verdict;
  points: number;
  maxPoints: number;
  durationMs: number;
  output: string;
}

export interface ProjectTaskResult {
  id: string;
  kind: TaskKind;
  status: TaskStatus | "PENDING";
  score?: number;
  maxScore?: number;
  weight: number;
  weightedScore: number;
  judge?: JudgeResult | undefined;
  tests?: CtestResult[] | undefined;
  build?: PublicBuild | undefined;
  blockedBy?: string[] | undefined;
  checklist?: string[] | undefined;
  inputFingerprint?: string | undefined;
  changedDuringRun?: boolean | undefined;
  assessedAt?: string | undefined;
}

export interface ProjectScore {
  target: TargetName;
  tasks: ProjectTaskResult[];
  automatedScore: number;
  automatedMax: number;
  manualPending: number;
  provisionalTotal: number;
  total: 100;
  automatedFull: boolean;
  internalError: boolean;
  selectedTaskId?: string | undefined;
  partial: boolean;
  current: CurrentProject;
}

export interface ProjectOptions {
  target?: TargetName | undefined;
  taskId?: string | undefined;
  caseId?: string | undefined;
  environment?: ProjectEnvironment | undefined;
}

function programView(lab: LoadedProjectLab, task: ProjectTask): JudgeableLab {
  return {
    labRoot: task.taskPath,
    manifest: {
      toolchain: lab.manifest.toolchain,
      targets: task.config.targets,
      judge: task.config.judge!,
    },
    cases: task.cases ?? [],
  };
}

function selectedTasks(lab: LoadedProjectLab, taskId?: string): ProjectTask[] {
  if (taskId === undefined) return lab.tasks;
  const selected = lab.tasks.filter((task) => task.id === taskId);
  if (!selected.length) throw new LabError("TASK_NOT_FOUND", `不存在 Project task：${taskId}`);

  return selected;
}

function selectedTask(lab: LoadedProjectLab, taskId?: string): ProjectTask {
  const [task] = selectedTasks(lab, taskId);
  if (task === undefined) throw new LabError("TASK_NOT_FOUND", "Project 没有可运行的 task");

  return task;
}

export function cmakeStandardNumber(standard: string): string {
  if (standard === "c++17") return "17";
  if (standard === "c++20") return "20";

  throw new LabError("TOOLCHAIN_STANDARD", `Project 不支持 C++ 标准：${standard}`);
}

function assertTarget(target: string): asserts target is TargetName {
  if (!["student", "solution"].includes(target))
    throw new LabError("TARGET_INVALID", "Project target 必须是 student 或 solution");
}

/** MSVC 优先；没装 Visual Studio 但有 MinGW 时退回去，换生成器前必须清掉按旧生成器配置的缓存。 */
async function windowsEnvironment(lab: LoadedProjectLab, target: TargetName): Promise<ProjectEnvironment | undefined> {
  if (process.platform !== "win32") return undefined;
  try {
    return await createMsvcEnvironment();
  } catch (error) {
    const mingw = await createMinGwEnvironment();
    if (mingw === undefined) throw error;
    await rm(path.join(lab.labRoot, ".lab-cache", "cmake", target), { recursive: true, force: true });

    return mingw;
  }
}

async function configureProject(
  lab: LoadedProjectLab,
  target: TargetName,
  options: ProjectOptions = {},
): Promise<BuildState> {
  assertTarget(target);
  if (target === "solution" && lab.manifest.distribution === "student") {
    throw new LabError("SOLUTION_UNAVAILABLE", "学生分发包不包含参考实现");
  }
  const environment = options.environment ?? (await windowsEnvironment(lab, target));
  const configure = await runProcess(
    "cmake",
    [
      "--preset",
      target,
      `-DCMAKE_CXX_STANDARD=${cmakeStandardNumber(lab.manifest.toolchain.standard)}`,
      "-DCMAKE_CXX_STANDARD_REQUIRED=ON",
      "-DCMAKE_CXX_EXTENSIONS=OFF",
    ],
    { cwd: lab.labRoot, env: environment?.env, timeMs: 60_000, outputKb: 4096 },
  );
  if (configure.spawnError) throw new LabError("CMAKE_NOT_FOUND", "无法启动 CMake；Project Lab 需要 CMake >= 3.25");

  return {
    ok: configure.code === 0 && !configure.timedOut && !configure.outputExceeded,
    phase: "configure",
    target,
    configure,
    environment,
  };
}

async function buildTargets(lab: LoadedProjectLab, configured: BuildState, targets?: string[]): Promise<BuildState> {
  if (!configured.ok) return { ...configured, scope: "project" };
  const args = ["--build", "--preset", configured.target, "--config", "Release"];
  // 复制或还原出来的源码可能保留旧 mtime，每轮先 clean 一次，避免拿陈旧二进制判分。
  if (!configured.cleaned) {
    args.push("--clean-first");
    configured.cleaned = true;
  }
  if (targets !== undefined && targets.length > 0) args.push("--target", ...targets);
  const build = await runProcess("cmake", args, {
    cwd: lab.labRoot,
    env: configured.environment?.env,
    timeMs: 120_000,
    outputKb: 8192,
  });

  return {
    ...configured,
    ok: !build.spawnError && build.code === 0 && !build.timedOut && !build.outputExceeded,
    phase: "build",
    build,
    targets,
    scope: targets !== undefined && targets.length > 0 ? "task" : "project",
    legacyBuild: targets === undefined || targets.length === 0,
  };
}

function publicBuild(build: BuildState): PublicBuild {
  const { environment, cleaned, ...report } = build;

  return report;
}

async function buildTask(
  lab: LoadedProjectLab,
  task: ProjectTask,
  configured: BuildState,
  modules: Map<string, BuildState>,
): Promise<BuildState> {
  if (!configured.ok) {
    return {
      ...configured,
      scope: "project",
      relatedTasks: lab.tasks.filter((item) => item.kind === "ctest").map((item) => item.id),
    };
  }
  // 只探测实现目标，不探测上游测试：上游 WA 不该阻断下游构建。
  for (const dependency of dependencyClosure(lab, task, (item) => item.buildDependsOn ?? [])) {
    const targets = dependency.config.ctest?.moduleTargets;
    if (!targets) continue;
    if (!modules.has(dependency.id)) modules.set(dependency.id, await buildTargets(lab, configured, targets));
    const built = modules.get(dependency.id)!;
    if (!built.ok) return { ...built, blockedBy: [dependency.id], relatedTasks: [dependency.id, task.id] };
  }

  return {
    ...(await buildTargets(lab, configured, task.config.ctest?.buildTargets)),
    relatedTasks: [task.id, ...(task.buildDependsOn ?? [])],
  };
}

export async function buildProject(
  lab: LoadedProjectLab,
  target: TargetName = "student",
  options: ProjectOptions = {},
): Promise<PublicBuild> {
  return withProjectLock(lab, async () => {
    const configured = await configureProject(lab, target, options);
    if (options.taskId === undefined) return publicBuild(await buildTargets(lab, configured));
    const task = selectedTask(lab, options.taskId);
    if (task.kind !== "ctest")
      throw new LabError("TYPE_UNSUPPORTED", "Project build --task 需要 CTest task；stdio 请使用 run --task");

    return publicBuild(await buildTask(lab, task, configured, new Map()));
  });
}

export function classifyCtestExecution(result: CaptureResult): Verdict {
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.spawnError || /No tests were found/i.test(output)) return "IE";
  if (result.outputExceeded) return "OLE";
  if (result.timedOut) return "TLE";

  return result.code === 0 ? "AC" : "WA";
}

async function scoreCtest(
  lab: LoadedProjectLab,
  task: ProjectTask,
  target: TargetName,
  build: BuildState,
): Promise<ProjectTaskResult> {
  if (!build.ok) {
    return {
      id: task.id,
      kind: task.kind,
      status:
        build.blockedBy !== undefined && build.blockedBy.length > 0
          ? "BLOCKED"
          : build.build?.spawnError === undefined
            ? "CE"
            : "IE",
      score: 0,
      maxScore: 100,
      weight: task.weight,
      weightedScore: 0,
      tests: [],
      build: publicBuild(build),
      blockedBy: build.blockedBy,
    };
  }
  const binaryDir = path.join(lab.labRoot, ".lab-cache", "cmake", target);
  const tests: CtestResult[] = [];
  for (const test of task.config.ctest!.tests) {
    const expression = `^${test.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;
    const result = await runProcess(
      "ctest",
      ["--test-dir", binaryDir, "-C", "Release", "-R", expression, "--no-tests=error", "--output-on-failure"],
      { cwd: lab.labRoot, env: build.environment?.env, timeMs: 60_000, outputKb: 4096 },
    );
    const verdict = classifyCtestExecution(result);
    tests.push({
      name: test.name,
      verdict,
      points: verdict === "AC" ? test.points : 0,
      maxPoints: test.points,
      durationMs: result.durationMs,
      output: `${result.stdout}\n${result.stderr}`.trim(),
    });
  }
  const score = tests.reduce((total, test) => total + test.points, 0);

  return {
    id: task.id,
    kind: task.kind,
    status: tests.find((test) => test.verdict !== "AC")?.verdict ?? "AC",
    score,
    maxScore: 100,
    weight: task.weight,
    weightedScore: (score * task.weight) / 100,
    tests,
    build: publicBuild(build),
  };
}

/** 只看各层 verdict，参数不必是完整的任务结果。 */
export type TaskVerdictView = Pick<ProjectTaskResult, "id" | "status"> & {
  judge?: { cases?: Pick<CaseResult, "verdict">[] | undefined } | undefined;
  tests?: Pick<CtestResult, "verdict">[] | undefined;
};

export function projectHasInternalError(results: TaskVerdictView[]): boolean {
  return results.some(
    (task) =>
      task.status === "IE" ||
      task.judge?.cases?.some((testCase) => testCase.verdict === "IE") ||
      task.tests?.some((testCase) => testCase.verdict === "IE"),
  );
}

async function scoreProjectUnlocked(lab: LoadedProjectLab, options: ProjectOptions): Promise<ProjectScore> {
  const target = options.target ?? "student";
  assertTarget(target);
  const tasks = selectedTasks(lab, options.taskId);
  if (options.caseId !== undefined && (tasks.length !== 1 || tasks[0]?.kind !== "stdio")) {
    throw new LabError("ARGUMENT_INVALID", "Project --case 必须同时选择一个 stdio --task");
  }
  const before = await projectInputs(lab, target);
  let configured: BuildState | undefined;
  if (tasks.some((task) => task.kind === "ctest")) configured = await configureProject(lab, target, options);
  const modules = new Map<string, BuildState>();
  const results: ProjectTaskResult[] = [];
  for (const task of tasks) {
    if (task.kind === "manual") {
      results.push({
        id: task.id,
        kind: task.kind,
        status: "PENDING",
        weight: task.weight,
        weightedScore: 0,
        checklist: task.config.checklist,
      });
    } else if (task.kind === "stdio") {
      const judged = await judgeProgram(programView(lab, task), { target, caseId: options.caseId });
      results.push({
        id: task.id,
        kind: task.kind,
        status: judged.verdict,
        score: judged.score,
        maxScore: judged.maxScore,
        weight: task.weight,
        weightedScore: judged.maxScore ? (judged.score / judged.maxScore) * task.weight : 0,
        judge: judged,
      });
    } else {
      results.push(await scoreCtest(lab, task, target, await buildTask(lab, task, configured!, modules)));
    }
  }
  const automated = results.filter((task) => task.kind !== "manual");
  const automatedScore = automated.reduce((total, task) => total + task.weightedScore, 0);
  const after = await projectInputs(lab, target);
  const at = new Date().toISOString();
  const state = await readProjectState(lab, target);
  for (const result of results) {
    const inputs = before[result.id]!;
    result.inputFingerprint = inputs.fingerprint;
    result.changedDuringRun = inputs.fingerprint !== after[result.id]!.fingerprint;
    result.assessedAt = at;
    if (result.kind !== "manual" && options.caseId === undefined) {
      state.tasks[result.id] = {
        at,
        fingerprint: inputs.fingerprint,
        changedDuringRun: result.changedDuringRun,
        bestScore: Math.max(state.tasks[result.id]?.bestScore ?? 0, result.weightedScore),
        result: result as never,
      };
    }
  }
  await writeProjectState(lab, target, state);

  return {
    target,
    tasks: results,
    automatedScore,
    automatedMax: automated.reduce((total, task) => total + task.weight, 0),
    manualPending: results.filter((task) => task.kind === "manual").reduce((total, task) => total + task.weight, 0),
    provisionalTotal: automatedScore,
    total: 100,
    automatedFull: automated.length > 0 && automated.every((task) => task.status === "AC" && !task.changedDuringRun),
    internalError: projectHasInternalError(results),
    selectedTaskId: options.taskId,
    partial: Boolean(options.caseId),
    current: currentProject(lab, state, after),
  };
}

export async function scoreProject(lab: LoadedProjectLab, options: ProjectOptions = {}): Promise<ProjectScore> {
  return withProjectLock(lab, () => scoreProjectUnlocked(lab, options));
}

export interface ProjectRefreshResult {
  changed: number;
  written: number;
  tasks: { id: string; refresh: RefreshResult }[];
}

export async function refreshProjectExpected(
  lab: LoadedProjectLab,
  options: { taskId?: string | undefined; write?: boolean | undefined } = {},
): Promise<ProjectRefreshResult> {
  const stdioTasks = selectedTasks(lab, options.taskId).filter((task) => task.kind === "stdio");
  if (stdioTasks.length === 0) {
    throw new LabError(
      "TYPE_UNSUPPORTED",
      options.taskId === undefined
        ? "当前 Project 没有可刷新 .out 的 stdio task"
        : `task ${options.taskId} 不是 stdio task，不能刷新 .out`,
    );
  }
  const tasks: ProjectRefreshResult["tasks"] = [];
  for (const task of stdioTasks) {
    tasks.push({
      id: task.id,
      refresh: await refreshExpected(programView(lab, task) as never, Boolean(options.write)),
    });
  }

  return {
    changed: tasks.reduce((total, task) => total + task.refresh.changed, 0),
    written: tasks.reduce((total, task) => total + task.refresh.written, 0),
    tasks,
  };
}

export async function interactiveProjectTask(
  lab: LoadedProjectLab,
  taskId: string | undefined,
  target: TargetName = "student",
): Promise<InteractiveResult> {
  const task = selectedTask(lab, taskId);
  if (task.kind !== "stdio") throw new LabError("TYPE_UNSUPPORTED", "interactive 只支持 stdio task");

  return runInteractive(programView(lab, task), target);
}

export interface ProjectVerifyResult {
  ok: boolean;
  checks: Record<string, boolean>;
  drift: ProjectRefreshResult;
  solution: ProjectScore;
  student: ProjectScore;
}

export async function verifyProject(lab: LoadedProjectLab): Promise<ProjectVerifyResult> {
  const drift = await refreshProjectExpected(lab, { write: false }).catch((error: LabError) => {
    if (error?.code === "TYPE_UNSUPPORTED") return { changed: 0, written: 0, tasks: [] };
    throw error;
  });
  const solution = await scoreProject(lab, { target: "solution" });
  const student = await scoreProject(lab, { target: "student" });
  const checks = {
    solutionAutomatedFull: solution.automatedFull,
    studentNotFull: !student.automatedFull,
    studentCompiles: student.tasks.every((task) => !["CE", "BLOCKED", "IE"].includes(task.status)),
    weightsTotal100: solution.automatedMax + solution.manualPending === 100,
    expectedStable: drift.changed === 0,
  };

  return { ok: Object.values(checks).every(Boolean), checks, drift, solution, student };
}

export interface FormatProjectOptions {
  theme?: Theme;
  command?: string;
  labPath?: string;
}

function projectRetry(command: string, labPath?: string, taskId?: string, caseId?: string): string | undefined {
  if (labPath === undefined || taskId === undefined) return undefined;
  const parts = [command, quoteCommandArg(labPath), "--task", quoteCommandArg(taskId)];
  if (caseId !== undefined) parts.push("--case", quoteCommandArg(caseId));

  return parts.join(" ");
}

/** 渲染只读分数与任务表，不需要调度状态。 */
export type ProjectView = Pick<
  ProjectScore,
  "tasks" | "automatedScore" | "automatedMax" | "manualPending" | "provisionalTotal" | "total" | "automatedFull"
> & { current?: CurrentProject };

export function formatProject(result: ProjectView, options: FormatProjectOptions = {}): string {
  const theme = options.theme ?? createTheme({ color: false });
  const taskWidth = Math.max(20, ...result.tasks.map((task) => task.id.length));
  const nestedWidth = Math.max(
    18,
    ...result.tasks.flatMap((task) => [
      ...(task.judge?.cases?.map((item) => item.id.length) ?? []),
      ...(task.tests?.map((test) => test.name.length) ?? []),
    ]),
  );
  const lines = [
    `${theme.cell("TASK", taskWidth, theme.muted)} ${theme.cell("KIND", 9, theme.muted)} ${theme.cell("RESULT", 9, theme.muted)} ${theme.muted("SCORE")}`,
  ];
  for (const task of result.tasks) {
    const score =
      task.kind === "manual"
        ? `${theme.warning("PENDING")} /${theme.success(task.weight)}`
        : theme.score(task.weightedScore, task.weight);
    lines.push(
      `${theme.cell(task.id, taskWidth)} ${theme.cell(task.kind, 9)} ${theme.cell(task.status, 9, theme.verdict)} ${score}`,
    );
    if (task.judge) {
      for (const item of task.judge.cases) {
        lines.push(
          `  ${theme.cell(item.id, nestedWidth)} ${theme.cell(item.verdict, 9, theme.verdict)} ${theme.score(item.points, item.maxPoints)}`,
        );
        if (item.comparison && !item.comparison.equal) {
          const difference = item.comparison.difference;
          const location =
            difference.kind === "token"
              ? `第 ${difference.index} 个 token`
              : `第 ${difference.line} 行第 ${difference.column} 列`;
          lines.push(
            `    ${theme.heading("首处差异：")}${location}`,
            `    ${theme.muted("期望：")} ${JSON.stringify(difference.expected)}`,
            `    ${theme.muted("实际：")} ${JSON.stringify(difference.actual)}`,
          );
        }
        if (item.stderr)
          lines.push(`    ${theme.heading("stderr")}`, cleanTerminalText(item.stderr).trim().slice(0, 500));
      }
      if (task.status === "CE") {
        const diagnostic = cleanTerminalText(task.judge.compilation?.stderr || task.judge.compilation?.stdout).trim();
        if (diagnostic) lines.push(`  ${theme.heading("编译诊断")}`, diagnostic);
      }
    }
    if (task.tests) {
      for (const test of task.tests) {
        lines.push(
          `  ${theme.cell(test.name, nestedWidth)} ${theme.cell(test.verdict, 9, theme.verdict)} ${theme.score(test.points, test.maxPoints)}`,
        );
        if (test.verdict !== "AC" && test.output) {
          lines.push(`    ${theme.heading("CTest output")}`, cleanTerminalText(test.output).trim().slice(0, 1000));
        }
      }
    }
    if (task.build && !task.build.ok) {
      lines.push(`  ${theme.heading(`CMake ${task.build.phase} (${task.build.scope ?? "task"})`)}`);
      if (task.blockedBy !== undefined && task.blockedBy.length > 0)
        lines.push(`  BLOCKED BY: ${task.blockedBy.join(", ")}`);
      const diagnostic = task.build.build ?? task.build.configure;
      lines.push(cleanTerminalText(`${diagnostic?.stdout ?? ""}\n${diagnostic?.stderr ?? ""}`).trim());
    }
    if (task.build?.legacyBuild) lines.push("  Legacy whole-project build: add ctest.buildTargets for task isolation.");
    if (task.changedDuringRun) lines.push("  STALE: inputs changed during assessment; retry required.");
  }
  lines.push(theme.separator(Math.max(56, taskWidth + 37)));
  lines.push(`${theme.heading("Automated：")} ${theme.score(result.automatedScore, result.automatedMax)}`);
  lines.push(
    `${theme.heading("Manual pending：")} ${result.manualPending ? theme.warning(result.manualPending) : theme.success("0")}`,
  );
  lines.push(`${theme.heading("Provisional total：")} ${theme.score(result.provisionalTotal, result.total)}`);
  lines.push(
    `AUTOMATED ${theme.status(result.automatedFull ? "PASS" : "NOT FULL")}${result.manualPending ? ` · ${theme.warning("MANUAL REVIEW PENDING")}` : ""}`,
  );
  if (result.current !== undefined) {
    lines.push(
      `CURRENT PROJECT: ${result.current.automatedScore}/${result.current.automatedMax} · ${result.current.complete ? "COMPLETE" : "INCOMPLETE"}`,
    );
    for (const task of result.current.tasks) {
      lines.push(
        `  ${task.id}: ${task.status} ${task.weightedScore}/${task.weight}${task.status === "STALE" ? ` (historical ${task.historicalScore}/${task.weight})` : ""}`,
      );
    }
  }
  const failedTask = result.tasks.find((task) => task.kind !== "manual" && task.status !== "AC");
  const retry = projectRetry(
    options.command ?? "pnpm lab run",
    options.labPath,
    failedTask?.id,
    failedTask?.judge?.cases?.find((item) => item.verdict !== "AC")?.id,
  );
  if (retry !== undefined) lines.push(`${theme.heading("Retry：")} ${theme.command(retry)}`);

  return lines.join("\n");
}
