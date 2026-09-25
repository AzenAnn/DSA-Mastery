import type { LabType } from "../identity/layout.ts";
import type { CompareConfig, CompareMode } from "./compare.ts";
import type { QuizQuestion } from "./quiz.ts";
import type { Json } from "./schema.ts";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { LabError } from "../errors.ts";
import { parseLabId } from "../identity/lab-id.ts";
import { isLabType } from "../identity/layout.ts";
import { THIN_MAKEFILE } from "./makefile.ts";
import { parseQuizQuestions, validateQuizReadme } from "./quiz.ts";
import {
  assertKnownKeys,
  pathExists,
  readJson,
  requirePositiveInteger,
  requireRecord,
  requireString,
  requireStringArray,
} from "./schema.ts";

const LAB_SCHEMA_VERSION = 1;
const JSON_REPORT_VERSION = 1;
const COMPARE_MODES: ReadonlySet<string> = new Set<CompareMode>(["exact", "tokens", "float"]);
const TASK_KINDS: ReadonlySet<string> = new Set<TaskKind>(["stdio", "ctest", "manual"]);

export type Distribution = "source" | "student";
export type TaskKind = "stdio" | "ctest" | "manual";
export type TargetName = "student" | "solution";

export interface Limits {
  timeMs?: number;
  outputKb?: number;
}

export interface CompileTarget {
  sources: string[];
  includeDirs?: string[];
}

export interface JudgeConfig {
  kind: "stdio";
  cases: string;
  compare?: CompareConfig;
  limits?: Limits;
}

export interface LabCase {
  id: string;
  input: string;
  expected: string;
  points: number;
  tags?: string[];
  timeMs?: number;
  outputKb?: number;
  compare?: CompareConfig;
}

export interface Toolchain {
  standard: "c++17" | "c++20";
  profile?: string;
}

interface ManifestBase {
  $schema?: string;
  schemaVersion: number;
  distribution?: Distribution;
}

export interface QuizManifest extends ManifestBase {
  type: "quiz";
  quiz: { questions: string; questionType?: string; reveal?: string; scoring?: string };
}

export interface ProgramManifest extends ManifestBase {
  type: "program";
  language: "cpp";
  toolchain: Toolchain;
  targets: { student: CompileTarget; solution?: CompileTarget };
  judge: JudgeConfig;
}

export interface ProjectManifest extends ManifestBase {
  type: "project";
  language: "cpp";
  toolchain: Toolchain;
  buildSystem: "cmake";
  tasks: ProjectTaskDeclaration[];
}

export type LabManifest = QuizManifest | ProgramManifest | ProjectManifest;

export interface ProjectTaskDeclaration {
  id: string;
  path: string;
  weight: number;
  kind: TaskKind;
  dependsOn?: string[];
  buildDependsOn?: string[];
}

export interface CtestEntry {
  name: string;
  points: number;
}

export interface TaskConfig {
  $schema?: string;
  schemaVersion: number;
  kind: TaskKind;
  targets?: { student: CompileTarget; solution?: CompileTarget };
  judge?: JudgeConfig;
  ctest?: { tests: CtestEntry[]; buildTargets?: string[]; moduleTargets?: string[] } | undefined;
  checklist?: string[] | undefined;
}

export interface ProjectTask extends ProjectTaskDeclaration {
  dependsOn: string[];
  taskPath: string;
  config: TaskConfig;
  cases?: LabCase[];
}

interface LoadedLabBase {
  labRoot: string;
  manifestPath: string;
  labId?: string | undefined;
}

export interface LoadedQuizLab extends LoadedLabBase {
  manifest: QuizManifest;
  quizPath: string;
  questions: QuizQuestion[];
  quizResult: { count: number; totalPoints: number };
}

export interface LoadedProgramLab extends LoadedLabBase {
  manifest: ProgramManifest;
  cases: LabCase[];
}

export interface LoadedProjectLab extends LoadedLabBase {
  manifest: ProjectManifest;
  tasks: ProjectTask[];
}

export type LoadedLab = LoadedQuizLab | LoadedProgramLab | LoadedProjectLab;
export type ExecutableLab = LoadedProgramLab | LoadedProjectLab;

// 判别字段藏在 manifest.type 里，TypeScript 收窄不到外层联合，用显式类型守卫补上。
export function isQuizLab(lab: LoadedLab): lab is LoadedQuizLab {
  return lab.manifest.type === "quiz";
}

export function isProgramLab(lab: LoadedLab): lab is LoadedProgramLab {
  return lab.manifest.type === "program";
}

export function isProjectLab(lab: LoadedLab): lab is LoadedProjectLab {
  return lab.manifest.type === "project";
}

export async function findLabRoot(start: string = process.cwd()): Promise<string> {
  let current = path.resolve(start);
  if (await pathExists(current)) {
    const stats = await lstat(current);
    if (!stats.isDirectory()) current = path.dirname(current);
  }
  while (true) {
    if (await pathExists(path.join(current, "lab.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new LabError("LAB_NOT_FOUND", `从 ${path.resolve(start)} 向上未找到 lab.json`);
}

function isWithin(root: string, target: string): boolean {
  const relative = path.relative(root, target);

  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function resolveLabPath(
  labRoot: string,
  value: unknown,
  label: string,
  { mustExist = true }: { mustExist?: boolean } = {},
): Promise<string> {
  if (typeof value !== "string" || !value.trim()) {
    throw new LabError("PATH_INVALID", `${label} 必须是非空相对路径`);
  }
  if (path.isAbsolute(value)) throw new LabError("PATH_ESCAPE", `${label} 不得使用绝对路径：${value}`);
  const root = path.resolve(labRoot);
  const target = path.resolve(root, value);
  if (!isWithin(root, target)) throw new LabError("PATH_ESCAPE", `${label} 不能逃出当前 Lab：${value}`);
  if (!mustExist) return target;
  if (!(await pathExists(target))) throw new LabError("FILE_NOT_FOUND", `${label} 不存在：${value}`);
  const [realRoot, realTarget] = await Promise.all([realpath(root), realpath(target)]);
  if (!isWithin(realRoot, realTarget)) {
    throw new LabError("PATH_ESCAPE", `${label} 通过符号链接逃出当前 Lab：${value}`);
  }

  return target;
}

function validateCompare(value: unknown, label: string): CompareConfig | undefined {
  if (value === undefined) return undefined;
  const compare = requireRecord(value, label);
  assertKnownKeys(compare, new Set(["mode", "absTol", "relTol"]), label);
  if (!COMPARE_MODES.has(compare["mode"] as string)) {
    throw new LabError("SCHEMA_INVALID", `${label}.mode 必须是 exact、tokens 或 float`);
  }
  for (const key of ["absTol", "relTol"] as const) {
    if (compare[key] !== undefined && (typeof compare[key] !== "number" || compare[key] < 0)) {
      throw new LabError("SCHEMA_INVALID", `${label}.${key} 必须是非负数`);
    }
  }

  return compare as unknown as CompareConfig;
}

function validateLimits(value: unknown, label: string): Limits | undefined {
  if (value === undefined) return undefined;
  const limits = requireRecord(value, label);
  assertKnownKeys(limits, new Set(["timeMs", "outputKb"]), label);
  for (const key of ["timeMs", "outputKb"] as const) {
    if (limits[key] !== undefined) requirePositiveInteger(limits[key], `${label}.${key}`);
  }

  return limits;
}

async function validateSources(labRoot: string, value: unknown, label: string): Promise<CompileTarget> {
  const target = requireRecord(value, label);
  assertKnownKeys(target, new Set(["sources", "includeDirs"]), label);
  if (!Array.isArray(target["sources"]) || target["sources"].length === 0) {
    throw new LabError("SCHEMA_INVALID", `${label}.sources 必须是非空数组`);
  }
  for (const [index, source] of target["sources"].entries()) {
    await resolveLabPath(labRoot, source, `${label}.sources[${index}]`);
  }
  if (target["includeDirs"] !== undefined) {
    if (!Array.isArray(target["includeDirs"])) throw new LabError("SCHEMA_INVALID", `${label}.includeDirs 必须是数组`);
    for (const [index, dir] of target["includeDirs"].entries()) {
      await resolveLabPath(labRoot, dir, `${label}.includeDirs[${index}]`);
    }
  }

  return target as unknown as CompileTarget;
}

async function loadCases(labRoot: string, casesPath: string): Promise<LabCase[]> {
  const absolute = await resolveLabPath(labRoot, casesPath, "judge.cases");
  const cases = await readJson(absolute, path.relative(labRoot, absolute));
  if (!Array.isArray(cases) || cases.length === 0) throw new LabError("CASES_INVALID", "cases.json 顶层必须是非空数组");
  const ids = new Set<string>();
  let totalPoints = 0;
  for (const [index, raw] of cases.entries()) {
    const item = requireRecord(raw, `cases[${index}]`);
    assertKnownKeys(
      item,
      new Set(["id", "input", "expected", "points", "tags", "timeMs", "outputKb", "compare"]),
      `cases[${index}]`,
    );
    const id = requireString(item["id"], `cases[${index}].id`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new LabError("CASES_INVALID", `cases[${index}].id 格式无效：${id}`);
    if (ids.has(id)) throw new LabError("CASES_INVALID", `用例 id 重复：${id}`);
    ids.add(id);
    await resolveLabPath(labRoot, item["input"], `cases[${index}].input`);
    await resolveLabPath(labRoot, item["expected"], `cases[${index}].expected`);
    totalPoints += requirePositiveInteger(item["points"], `cases[${index}].points`);
    if (item["tags"] !== undefined) requireStringArray(item["tags"], `cases[${index}].tags`, "CASES_INVALID");
    if (item["timeMs"] !== undefined) requirePositiveInteger(item["timeMs"], `cases[${index}].timeMs`);
    if (item["outputKb"] !== undefined) requirePositiveInteger(item["outputKb"], `cases[${index}].outputKb`);
    validateCompare(item["compare"], `cases[${index}].compare`);
  }
  if (totalPoints !== 100) throw new LabError("CASES_POINTS", `测试用例分值必须合计 100，当前为 ${totalPoints}`);

  return cases as LabCase[];
}

function assertAcyclic(tasks: ProjectTask[]): ProjectTask[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const state = new Map<string, "visiting" | "done">();
  const ordered: ProjectTask[] = [];
  function visit(id: string, chain: string[]): void {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting")
      throw new LabError("TASK_CYCLE", `Project task 存在循环依赖：${[...chain, id].join(" -> ")}`);
    state.set(id, "visiting");
    const task = byId.get(id)!;
    for (const dependency of new Set([...task.dependsOn, ...(task.buildDependsOn ?? [])]))
      visit(dependency, [...chain, id]);
    state.set(id, "done");
    ordered.push(task);
  }
  for (const task of tasks) visit(task.id, []);

  return ordered;
}

async function validateThinMakefile(labRoot: string, distribution: Distribution | undefined): Promise<void> {
  if (distribution === "student") return;
  const makefile = await readFile(path.join(labRoot, "Makefile"), "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error?.code === "ENOENT") throw new LabError("MAKEFILE_MISSING", "可执行 Lab 缺少薄 Makefile");
    throw error;
  });
  if (makefile.replace(/\r\n/g, "\n") !== THIN_MAKEFILE) {
    throw new LabError("MAKEFILE_DRIFT", "Lab Makefile 已偏离统一薄模板；请只 include packages/lab-cli/lab.mk");
  }
}

function validateCtest(config: Json, taskId: string): void {
  const ctest = requireRecord(config["ctest"], `${taskId}.ctest`);
  assertKnownKeys(ctest, new Set(["tests", "buildTargets", "moduleTargets"]), `${taskId}.ctest`);
  for (const key of ["buildTargets", "moduleTargets"] as const) {
    const targets = ctest[key];
    if (targets === undefined) continue;
    const valid =
      Array.isArray(targets) &&
      targets.length > 0 &&
      targets.every((name) => typeof name === "string" && /^\w[\w.+-]*$/.test(name)) &&
      new Set(targets).size === targets.length;
    if (!valid) throw new LabError("SCHEMA_INVALID", `${taskId}.ctest.${key} 必须是非空、无重复的 CMake target 数组`);
  }
  if (!Array.isArray(ctest["tests"]) || ctest["tests"].length === 0) {
    throw new LabError("SCHEMA_INVALID", `${taskId}.ctest.tests 必须是非空数组`);
  }
  const names = new Set<string>();
  let points = 0;
  for (const [index, entry] of ctest["tests"].entries()) {
    const test = requireRecord(entry, `${taskId}.ctest.tests[${index}]`);
    assertKnownKeys(test, new Set(["name", "points"]), `${taskId}.ctest.tests[${index}]`);
    const name = requireString(test["name"], `${taskId}.ctest.tests[${index}].name`);
    if (names.has(name)) throw new LabError("TASK_DUPLICATE", `${taskId} 的 CTest 名称重复：${name}`);
    names.add(name);
    points += requirePositiveInteger(test["points"], `${taskId}.ctest.tests[${index}].points`);
  }
  if (points !== 100) throw new LabError("TASK_WEIGHTS", `${taskId} 的 CTest 分值必须合计 100，当前为 ${points}`);
}

async function validateProject(labRoot: string, manifest: ProjectManifest): Promise<ProjectTask[]> {
  if (manifest.buildSystem !== "cmake") throw new LabError("SCHEMA_INVALID", "project.buildSystem 必须是 cmake");
  if (!Array.isArray(manifest.tasks) || manifest.tasks.length === 0) {
    throw new LabError("SCHEMA_INVALID", "project.tasks 必须是非空数组");
  }
  const ids = new Set<string>();
  let totalWeight = 0;
  const tasks: ProjectTask[] = [];
  for (const [index, raw] of manifest.tasks.entries()) {
    const task = requireRecord(raw, `tasks[${index}]`);
    assertKnownKeys(task, new Set(["id", "path", "weight", "kind", "dependsOn", "buildDependsOn"]), `tasks[${index}]`);
    const id = requireString(task["id"], `tasks[${index}].id`);
    if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new LabError("SCHEMA_INVALID", `tasks[${index}].id 格式无效：${id}`);
    if (ids.has(id)) throw new LabError("TASK_DUPLICATE", `Project task id 重复：${id}`);
    ids.add(id);
    if (!TASK_KINDS.has(task["kind"] as string)) throw new LabError("SCHEMA_INVALID", `tasks[${index}].kind 无效`);
    const taskPath = await resolveLabPath(labRoot, task["path"], `tasks[${index}].path`);
    totalWeight += requirePositiveInteger(task["weight"], `tasks[${index}].weight`);
    const dependsOn =
      task["dependsOn"] === undefined ? [] : requireStringArray(task["dependsOn"], `tasks[${index}].dependsOn`);
    if (task["buildDependsOn"] !== undefined) {
      const buildDependsOn = requireStringArray(task["buildDependsOn"], `tasks[${index}].buildDependsOn`);
      if (buildDependsOn.some((item) => !/^[a-z][a-z0-9-]*$/.test(item))) {
        throw new LabError("SCHEMA_INVALID", `tasks[${index}].buildDependsOn 必须是 task ID 数组`);
      }
    }
    for (const dependencies of [dependsOn, (task["buildDependsOn"] ?? []) as string[]]) {
      if (new Set(dependencies).size !== dependencies.length) throw new LabError("TASK_DUPLICATE", `${id} 的依赖重复`);
    }
    tasks.push({
      ...(task as unknown as ProjectTaskDeclaration),
      taskPath,
      dependsOn,
      config: undefined as unknown as TaskConfig,
    });
  }
  if (totalWeight !== 100) throw new LabError("TASK_WEIGHTS", `Project task 权重必须合计 100，当前为 ${totalWeight}`);
  for (const task of tasks) {
    for (const dependency of new Set([...task.dependsOn, ...(task.buildDependsOn ?? [])])) {
      if (!ids.has(dependency)) throw new LabError("TASK_DEPENDENCY", `${task.id} 依赖不存在的 task：${dependency}`);
      if (dependency === task.id) throw new LabError("TASK_CYCLE", `${task.id} 不能依赖自身`);
    }
  }
  const orderedTasks = assertAcyclic(tasks);
  for (const task of orderedTasks) {
    const taskManifestPath = path.join(task.taskPath, "task.json");
    const config = requireRecord(
      await readJson(taskManifestPath, path.relative(labRoot, taskManifestPath)),
      `${task.id}/task.json`,
    );
    assertKnownKeys(
      config,
      new Set(["$schema", "schemaVersion", "kind", "targets", "judge", "ctest", "checklist"]),
      `${task.id}/task.json`,
    );
    if (config["schemaVersion"] !== LAB_SCHEMA_VERSION) {
      throw new LabError("SCHEMA_VERSION", `${task.id}/task.json 的 schemaVersion 必须是 ${LAB_SCHEMA_VERSION}`);
    }
    if (config["kind"] !== task.kind) throw new LabError("TASK_KIND", `${task.id} 的顶层 kind 与 task.json 不一致`);
    if (task.kind === "stdio") {
      const targets = requireRecord(config["targets"], `${task.id}.targets`);
      assertKnownKeys(targets, new Set(["student", "solution"]), `${task.id}.targets`);
      await validateSources(task.taskPath, targets["student"], `${task.id}.targets.student`);
      if (targets["solution"] !== undefined)
        await validateSources(task.taskPath, targets["solution"], `${task.id}.targets.solution`);
      else if (manifest.distribution !== "student")
        throw new LabError("SCHEMA_INVALID", `${task.id} 必须声明 targets.solution`);
      const judge = requireRecord(config["judge"], `${task.id}.judge`);
      assertKnownKeys(judge, new Set(["kind", "cases", "compare", "limits"]), `${task.id}.judge`);
      if (judge["kind"] !== "stdio") throw new LabError("SCHEMA_INVALID", `${task.id}.judge.kind 必须是 stdio`);
      validateCompare(judge["compare"], `${task.id}.judge.compare`);
      validateLimits(judge["limits"], `${task.id}.judge.limits`);
      task.cases = await loadCases(task.taskPath, requireString(judge["cases"], `${task.id}.judge.cases`));
    } else if (task.kind === "ctest") {
      validateCtest(config, task.id);
    } else if (
      !Array.isArray(config["checklist"]) ||
      config["checklist"].length === 0 ||
      config["checklist"].some((item) => typeof item !== "string" || !item.trim())
    ) {
      throw new LabError("SCHEMA_INVALID", `${task.id}.checklist 必须是非空字符串数组`);
    }
    task.config = config as unknown as TaskConfig;
  }

  return orderedTasks;
}

function validateToolchain(value: unknown): Toolchain {
  const toolchain = requireRecord(value, "toolchain");
  assertKnownKeys(toolchain, new Set(["standard", "profile"]), "toolchain");
  if (!["c++17", "c++20"].includes(toolchain["standard"] as string)) {
    throw new LabError("SCHEMA_INVALID", "toolchain.standard 必须是 c++17 或 c++20");
  }
  if (toolchain["profile"] !== undefined) requireString(toolchain["profile"], "toolchain.profile");

  return toolchain as unknown as Toolchain;
}

const BASE_KEYS = ["$schema", "schemaVersion", "type", "distribution"];

export async function loadLab(start: string = process.cwd()): Promise<LoadedLab> {
  const labRoot = await findLabRoot(start);
  const manifestPath = path.join(labRoot, "lab.json");
  const readmePath = await resolveLabPath(labRoot, "README.md", "README.md");
  const readme = await readFile(readmePath, "utf8");
  const labIdMatch = readme.match(/^labId:\s*["']?([^"'\s]+)["']?\s*$/m);
  const labId = labIdMatch ? parseLabId(labIdMatch[1]).id : undefined;
  const manifest = requireRecord(
    await readJson(manifestPath, path.relative(process.cwd(), manifestPath) || "lab.json"),
    "lab.json",
  );
  if (!Number.isInteger(manifest["schemaVersion"])) throw new LabError("SCHEMA_VERSION", "schemaVersion 必须是整数");
  if (manifest["schemaVersion"] !== LAB_SCHEMA_VERSION) {
    throw new LabError(
      "SCHEMA_VERSION",
      `不支持 schemaVersion ${String(manifest["schemaVersion"])}；当前 CLI 仅支持 ${LAB_SCHEMA_VERSION}`,
    );
  }
  if (!isLabType(manifest["type"])) throw new LabError("SCHEMA_INVALID", "type 必须是 quiz、program 或 project");
  if (manifest["distribution"] !== undefined && !["source", "student"].includes(manifest["distribution"] as string)) {
    throw new LabError("SCHEMA_INVALID", "distribution 必须是 source 或 student");
  }
  const distribution = manifest["distribution"] as Distribution | undefined;

  if (manifest["type"] === "quiz") {
    assertKnownKeys(manifest, new Set([...BASE_KEYS, "quiz"]), "lab.json");
    const quiz = requireRecord(manifest["quiz"], "quiz");
    assertKnownKeys(quiz, new Set(["questions", "questionType", "reveal", "scoring"]), "quiz");
    if (quiz["questionType"] !== undefined && quiz["questionType"] !== "single-choice") {
      throw new LabError("SCHEMA_INVALID", "quiz.questionType 必须是 single-choice");
    }
    if (quiz["reveal"] !== undefined && quiz["reveal"] !== "after-submit") {
      throw new LabError("SCHEMA_INVALID", "quiz.reveal 必须是 after-submit");
    }
    if (quiz["scoring"] !== undefined && !["equal", "points"].includes(quiz["scoring"] as string)) {
      throw new LabError("SCHEMA_INVALID", "quiz.scoring 必须是 equal 或 points");
    }
    validateQuizReadme(readme, path.relative(labRoot, readmePath));
    const quizPath = await resolveLabPath(labRoot, quiz["questions"], "quiz.questions");
    const questions = parseQuizQuestions(
      await readJson(quizPath, path.relative(labRoot, quizPath)),
      path.relative(labRoot, quizPath),
    );
    const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

    return {
      labRoot,
      manifestPath,
      manifest: manifest as unknown as QuizManifest,
      labId,
      quizPath,
      questions,
      quizResult: { count: questions.length, totalPoints },
    };
  }

  if (manifest["language"] !== "cpp") throw new LabError("SCHEMA_INVALID", "可执行 Lab 的 language 必须是 cpp");
  validateToolchain(manifest["toolchain"]);

  if (manifest["type"] === "program") {
    assertKnownKeys(manifest, new Set([...BASE_KEYS, "language", "toolchain", "targets", "judge"]), "lab.json");
    const targets = requireRecord(manifest["targets"], "targets");
    assertKnownKeys(targets, new Set(["student", "solution"]), "targets");
    await validateSources(labRoot, targets["student"], "targets.student");
    if (targets["solution"] !== undefined) await validateSources(labRoot, targets["solution"], "targets.solution");
    else if (distribution !== "student")
      throw new LabError("SCHEMA_INVALID", "源码仓库中的 program 必须声明 targets.solution");
    const judge = requireRecord(manifest["judge"], "judge");
    assertKnownKeys(judge, new Set(["kind", "cases", "compare", "limits"]), "judge");
    if (judge["kind"] !== "stdio") throw new LabError("SCHEMA_INVALID", "judge.kind 必须是 stdio");
    validateCompare(judge["compare"], "judge.compare");
    validateLimits(judge["limits"], "judge.limits");
    const cases = await loadCases(labRoot, requireString(judge["cases"], "judge.cases"));
    await validateThinMakefile(labRoot, distribution);

    return { labRoot, manifestPath, manifest: manifest as unknown as ProgramManifest, labId, cases };
  }

  assertKnownKeys(manifest, new Set([...BASE_KEYS, "language", "toolchain", "buildSystem", "tasks"]), "lab.json");
  const projectManifest = manifest as unknown as ProjectManifest;
  const tasks = await validateProject(labRoot, projectManifest);
  await validateThinMakefile(labRoot, distribution);

  return { labRoot, manifestPath, manifest: projectManifest, labId, tasks };
}

export interface LabReport {
  reportVersion: number;
  command: string;
  ok: boolean;
  lab: { id?: string | undefined; path: string; type: LabType; schemaVersion: number };
  [key: string]: unknown;
}

export function createReport(command: string, lab: LoadedLab, data: Record<string, unknown> = {}): LabReport {
  return {
    reportVersion: JSON_REPORT_VERSION,
    command,
    ok: true,
    lab: {
      id: lab.labId,
      path: lab.labRoot,
      type: lab.manifest.type,
      schemaVersion: lab.manifest.schemaVersion,
    },
    ...data,
  };
}
