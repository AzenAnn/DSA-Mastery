import type { Verdict } from "./judge.ts";
import type { ProjectTask, TargetName } from "@dsa/lab-core";
import { createHash } from "node:crypto";
import { mkdir, open, readdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { LabError } from "@dsa/lab-core";

/**
 * 判题引擎指纹：引擎变了就让 Project 的缓存成绩失效。
 * 打包产物由 tsdown 在构建期注入常量；直接跑源码时按源码树现算。
 */
declare const __LAB_ENGINE_FINGERPRINT__: string;

const ignoredDirectories = new Set([".lab-cache", "solution", ".git", "node_modules"]);
const binary = /\.(?:exe|o|obj|a|lib|so|dylib|dll|pdb|vsix)$/i;
const slash = (value: string): string => value.replaceAll("\\", "/");

/** 指纹与判分状态只依赖 Lab 根和任务的依赖关系，不碰 manifest，所以不要求完整的 LoadedProjectLab。 */
export type StateTask = Pick<
  ProjectTask,
  "id" | "path" | "kind" | "weight" | "dependsOn" | "buildDependsOn" | "config"
>;

export interface ProjectStateLab {
  labRoot: string;
  tasks: StateTask[];
}

export interface TaskInputs {
  fingerprint: string;
  files: string[];
}

export interface TaskResult {
  status: Verdict | "BLOCKED" | "STALE" | "UNASSESSED" | "PENDING";
  score?: number;
  maxScore?: number;
  weightedScore?: number;
  [key: string]: unknown;
}

export interface TaskStateEntry {
  result: TaskResult;
  fingerprint: string;
  changedDuringRun?: boolean;
  bestScore?: number;
  at?: string;
}

export interface ProjectState {
  version: 1;
  tasks: Record<string, TaskStateEntry>;
}

export interface CurrentTask extends TaskResult {
  id: string;
  kind: ProjectTask["kind"];
  weight: number;
  weightedScore: number;
  historicalScore?: number;
  bestScore?: number;
  previousStatus?: TaskResult["status"];
  assessedAt?: string;
  inputFingerprint: string;
  inputFiles: string[];
  valid: boolean;
  unsaved: boolean;
  dependsOn: string[];
  buildDependsOn?: string[];
  checklist?: string[];
}

export interface CurrentProject {
  tasks: CurrentTask[];
  automatedScore: number;
  automatedMax: number;
  manualPending: number;
  provisionalTotal: number;
  total: 100;
  automatedFull: boolean;
  internalError: boolean;
  complete: boolean;
}

export function sourceDependencies(task: StateTask): string[] {
  return task.buildDependsOn ?? task.dependsOn ?? [];
}

export function dependencyClosure(
  lab: ProjectStateLab,
  task: StateTask,
  dependencies: (task: StateTask) => string[] = sourceDependencies,
): StateTask[] {
  const result = new Set<string>();
  function visit(item: StateTask): void {
    for (const id of dependencies(item)) {
      if (result.has(id)) continue;
      result.add(id);
      visit(lab.tasks.find((candidate) => candidate.id === id)!);
    }
  }
  visit(task);

  return lab.tasks.filter((item) => result.has(item.id));
}

async function engineFingerprint(): Promise<string> {
  if (typeof __LAB_ENGINE_FINGERPRINT__ === "string") return __LAB_ENGINE_FINGERPRINT__;
  const hash = createHash("sha256");
  const directory = import.meta.dirname;
  for (const name of (await readdir(directory)).filter((entry) => entry.endsWith(".ts")).sort()) {
    hash.update(await readFile(path.join(directory, name)));
  }

  return hash.digest("hex");
}

export async function projectInputs(
  lab: ProjectStateLab,
  target: TargetName = "student",
): Promise<Record<string, TaskInputs>> {
  const files = new Map<string, string>();
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (ignoredDirectories.has(entry.name) && !(target === "solution" && entry.name === "solution")) continue;
      if (target === "solution" && entry.name === "student") continue;
      if (binary.test(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new LabError("PATH_ESCAPE", `Project 输入不支持符号链接：${absolute}`);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile()) {
        files.set(
          slash(path.relative(lab.labRoot, absolute)),
          createHash("sha256")
            .update(await readFile(absolute))
            .digest("hex"),
        );
      }
    }
  }
  await walk(lab.labRoot);
  const engine = await engineFingerprint();
  const roots = lab.tasks.map((task) => `${slash(task.path).replace(/\/$/, "")}/`);
  const shared = [...files.keys()].filter((file) => !roots.some((root) => file.startsWith(root)));

  return Object.fromEntries(
    lab.tasks.map((task) => {
      const owners = [task, ...dependencyClosure(lab, task)].map((item) => `${slash(item.path).replace(/\/$/, "")}/`);
      const inputs = [
        ...new Set([...shared, ...[...files.keys()].filter((file) => owners.some((root) => file.startsWith(root)))]),
      ].sort();
      const fingerprint = createHash("sha256")
        .update(JSON.stringify([target, engine, inputs.map((file) => [file, files.get(file)])]))
        .digest("hex");

      return [task.id, { fingerprint, files: inputs }];
    }),
  );
}

function statePath(lab: ProjectStateLab, target: TargetName): string {
  return path.join(lab.labRoot, ".lab-cache", `project-results-${target}.json`);
}

export async function readProjectState(lab: ProjectStateLab, target: TargetName): Promise<ProjectState> {
  try {
    const state = JSON.parse(await readFile(statePath(lab, target), "utf8")) as ProjectState;
    if (state.version !== 1 || typeof state.tasks !== "object") return { version: 1, tasks: {} };

    return state;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;

    return { version: 1, tasks: {} };
  }
}

export async function writeProjectState(lab: ProjectStateLab, target: TargetName, state: ProjectState): Promise<void> {
  const file = statePath(lab, target);
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  const handle = await open(temporary, "w");
  try {
    await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`);
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

export function currentProject(
  lab: ProjectStateLab,
  state: ProjectState,
  inputs: Record<string, TaskInputs>,
  dirtyFiles: string[] = [],
): CurrentProject {
  const tasks: CurrentTask[] = lab.tasks.map((task) => {
    const entry = state.tasks[task.id];
    const dirty = inputs[task.id].files.some((file) => dirtyFiles.includes(file));
    const valid =
      entry !== undefined && entry.fingerprint === inputs[task.id].fingerprint && !entry.changedDuringRun && !dirty;
    const status =
      task.kind === "manual" ? "PENDING" : entry === undefined ? "UNASSESSED" : valid ? entry.result.status : "STALE";

    return {
      ...(entry?.result ?? {}),
      id: task.id,
      kind: task.kind,
      weight: task.weight,
      status,
      weightedScore:
        valid && task.kind !== "manual"
          ? ((entry.result.score ?? 0) / (entry.result.maxScore ?? 100)) * task.weight
          : 0,
      historicalScore: entry?.result.weightedScore,
      bestScore: entry?.bestScore,
      previousStatus: entry?.result.status,
      assessedAt: entry?.at,
      inputFingerprint: inputs[task.id].fingerprint,
      inputFiles: inputs[task.id].files,
      valid: valid && task.kind !== "manual",
      dependsOn: task.dependsOn,
      unsaved: dirty,
      buildDependsOn: task.buildDependsOn,
      checklist: task.config.checklist,
    };
  });
  const automated = tasks.filter((task) => task.kind !== "manual");
  const automatedScore = automated.reduce((sum, task) => sum + task.weightedScore, 0);
  const manualPending = tasks.filter((task) => task.kind === "manual").reduce((sum, task) => sum + task.weight, 0);
  const automatedFull =
    automated.length > 0 &&
    automated.every((task) => task.valid && task.status === "AC" && task.score === task.maxScore);
  const internalError = tasks.some((task) => task.status === "IE");

  return {
    tasks,
    automatedScore,
    automatedMax: automated.reduce((sum, task) => sum + task.weight, 0),
    manualPending,
    provisionalTotal: automatedScore,
    total: 100,
    automatedFull,
    internalError,
    complete: automatedFull && manualPending === 0 && !internalError,
  };
}

export async function projectStatus(
  lab: ProjectStateLab,
  target: TargetName = "student",
  dirtyFiles: unknown = [],
): Promise<CurrentProject & { target: TargetName }> {
  if (!["student", "solution"].includes(target))
    throw new LabError("TARGET_INVALID", "Project target 必须是 student 或 solution");
  if (!Array.isArray(dirtyFiles) || dirtyFiles.some((file) => typeof file !== "string")) {
    throw new LabError("ARGUMENT_INVALID", "--dirty-files 必须为相对路径 JSON 数组");
  }
  const [state, inputs] = await Promise.all([readProjectState(lab, target), projectInputs(lab, target)]);

  return { target, ...currentProject(lab, state, inputs, (dirtyFiles as string[]).map(slash)) };
}

export async function withProjectLock<T>(lab: ProjectStateLab, operation: () => Promise<T>): Promise<T> {
  const directory = path.join(lab.labRoot, ".lab-cache");
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, "project.lock");
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      handle = await open(file, "wx");
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      let owner: { pid?: number } | undefined;
      try {
        owner = JSON.parse(await readFile(file, "utf8")) as { pid?: number };
      } catch {
        // 新 owner 可能正在写 PID，读不到就按“仍然存活”处理。
      }
      let alive = true;
      if (Number.isInteger(owner?.pid) && owner!.pid! > 0) {
        try {
          process.kill(owner!.pid!, 0);
        } catch (probe) {
          alive = (probe as NodeJS.ErrnoException).code !== "ESRCH";
        }
      }
      if (alive || attempt) {
        throw new LabError("PROJECT_BUSY", "该 Project 正在构建或测评，请等待完成后重试。", {
          lockFile: file,
          pid: owner?.pid,
        });
      }
      await rm(file, { force: true });
    }
  }
  try {
    await handle!.writeFile(JSON.stringify({ pid: process.pid }));

    return await operation();
  } finally {
    await handle!.close();
    await rm(file, { force: true });
  }
}
