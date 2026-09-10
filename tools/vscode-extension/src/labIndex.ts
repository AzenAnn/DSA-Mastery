import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { parseQuizQuestions, type QuizQuestion } from "./quiz";
import { readStableLabId } from "./labIdentity";

/**
 * 一道可作答 lab 的静态信息，来自 lab.json 与 README frontmatter。
 *
 * 共享字段独立出来，避免把 project 伪装成只有一个 student/main.cpp 的 program。
 */
interface LabBase {
  /** 稳定题号，例如 13E01。发布后不随目录或展示顺序改变，用作状态主键。 */
  id: string;
  /** 当前 lab 目录名，例如 E-13-01-container-with-most-water。 */
  name: string;
  /** 迁移前的目录名，仅用于把本机旧进度键转换为稳定 labId。 */
  legacyNames: string[];
  /** lab 目录绝对路径。 */
  labPath: string;
  /** 相对仓库根的路径，用于展示与传给 CLI。 */
  relativePath: string;
  title: string;
  description: string;
  chapter: number;
  chapterTitle: string;
  order: number;
  difficulty?: string;
  duration?: string;
  status?: string;
}

export interface ProgramLab extends LabBase {
  type: "program";
  /** student 目标的源文件相对路径，当前全部为单文件 student/main.cpp。 */
  studentSources: string[];
  /** judge.cases 声明的用例清单路径，通常是 tests/cases.json。 */
  casesFile: string;
}

export interface QuizLab extends LabBase {
  type: "quiz";
  quizQuestions: QuizQuestion[];
}

export type ProjectTaskKind = "stdio" | "ctest" | "manual";

export interface ProjectCtestTest {
  name: string;
  points: number;
}

export interface ProjectTask {
  id: string;
  /** 相对 Project 根目录的 task 路径，例如 tasks/task-01-matcher。 */
  relativePath: string;
  weight: number;
  kind: ProjectTaskKind;
  dependsOn: string[];
  /** stdio task 的 targets.student.sources；其它 task 为空。 */
  studentSources: string[];
  cases?: LoadedTestCase[];
  ctestTests?: ProjectCtestTest[];
  checklist?: string[];
}

export interface ProjectStudentFile {
  taskId: string;
  /** 相对 Project 根目录的文件路径，用于 UI 展示和安全匹配。 */
  relativePath: string;
  /** 文件绝对路径，用于打开和保存。 */
  absolutePath: string;
}

export interface ProjectLab extends LabBase {
  type: "project";
  buildSystem: "cmake";
  tasks: ProjectTask[];
  studentFiles: ProjectStudentFile[];
}

export type LabEntry = ProgramLab | QuizLab | ProjectLab;

export interface Chapter {
  chapter: number;
  chapterTitle: string;
  labs: LabEntry[];
}

/** tests/cases.json 中的一个公开用例。schema 中没有 hidden 字段，全部用例均可展示。 */
export interface TestCase {
  id: string;
  input: string;
  expected: string;
  points: number;
  tags?: string[];
  timeMs?: number;
  outputKb?: number;
}

export type LoadedTestCase = TestCase & { inputText: string; expectedText: string };

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

async function listDirectories(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function parseChapterNumber(source: unknown, fallbackDir: string): number {
  if (typeof source === "number" && Number.isFinite(source)) return source;
  const match = fallbackDir.match(/chapter-(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

/**
 * 扫描 labs/ 下全部 lab，返回 program、quiz 和 project 题目。
 *
 * program 走判题内核（编译 + 跑用例），quiz 完全在扩展内判定（读 quiz.json、
 * 比对选项），不需要编译器也不调用 CLI；project 由判题内核处理 stdio/CTest，
 * manual task 在扩展中只展示为待人工状态。
 *
 * 只有 README 而没有 lab.json 的目录同样跳过 —— 它们不可运行。
 */
export async function discoverProgramLabs(repoRoot: string): Promise<Chapter[]> {
  const labsRoot = path.join(repoRoot, "labs");
  const labs: LabEntry[] = [];
  const categories = ["theory", "exercise", "project"] as const;
  const categoryNames = new Set<string>(categories);

  for (const chapterDir of await listDirectories(labsRoot)) {
    const chapterPath = path.join(labsRoot, chapterDir);
    for (const category of categories) {
      const categoryPath = path.join(chapterPath, category);
      let labDirectories: string[];
      try {
        labDirectories = await listDirectories(categoryPath);
      } catch {
        continue;
      }
      for (const labDir of labDirectories) {
        const labPath = path.join(categoryPath, labDir);
        const lab = await loadProgramLab(repoRoot, labPath, labDir, chapterDir);
        if (lab) labs.push(lab);
      }
    }

    // PR#122 迁移完成前，当前 feature 分支仍可能检出旧的平铺目录；读取它们
    // 只用于兼容，不影响新分类目录的扫描，也不会把分类目录本身当作 Lab。
    const categorizedLegacyNames = new Set(labs.flatMap((lab) => lab.legacyNames));
    for (const labDir of await listDirectories(chapterPath)) {
      if (categoryNames.has(labDir)) continue;
      if (categorizedLegacyNames.has(labDir)) continue;
      const labPath = path.join(chapterPath, labDir);
      const lab = await loadProgramLab(repoRoot, labPath, labDir, chapterDir);
      if (!lab) continue;
      if (labs.some((existing) => existing.id === lab.id || existing.legacyNames.includes(lab.name))) continue;
      labs.push(lab);
    }
  }

  const byChapter = new Map<number, Chapter>();
  for (const lab of labs) {
    let chapter = byChapter.get(lab.chapter);
    if (!chapter) {
      chapter = { chapter: lab.chapter, chapterTitle: lab.chapterTitle, labs: [] };
      byChapter.set(lab.chapter, chapter);
    }
    chapter.labs.push(lab);
  }

  const chapters = [...byChapter.values()].sort((a, b) => a.chapter - b.chapter);
  for (const chapter of chapters) {
    chapter.labs.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }
  return chapters;
}

async function loadProgramLab(
  repoRoot: string,
  labPath: string,
  labDir: string,
  chapterDir: string,
): Promise<LabEntry | undefined> {
  let manifest: RawLabManifest;
  try {
    manifest = await readJson(path.join(labPath, "lab.json"));
  } catch {
    // 没有 lab.json（或无法解析）的目录不可运行，直接跳过。
    return undefined;
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return undefined;
  if (manifest.type !== "program" && manifest.type !== "quiz" && manifest.type !== "project") return undefined;

  let front: Record<string, unknown> = {};
  try {
    front = matter(await readFile(path.join(labPath, "README.md"), "utf8")).data;
  } catch {
    // README 缺失不致命，退化为使用目录名。
  }

  if (manifest.type === "quiz") {
    try {
      const quizFile = manifest.quiz?.questions ?? "quiz.json";
      const questions = parseQuizQuestions(await readJson<unknown>(path.join(labPath, quizFile)));
      return buildLab(repoRoot, labPath, labDir, chapterDir, front, {
        type: "quiz",
        quizQuestions: questions,
      });
    } catch {
      return undefined;
    }
  }

  if (manifest.type === "program") {
    const sources = stringArray(manifest.targets?.student?.sources) ?? [];
    if (sources.length === 0) return undefined;
    return buildLab(repoRoot, labPath, labDir, chapterDir, front, {
      type: "program",
      studentSources: sources,
      casesFile: manifest.judge?.cases ?? "tests/cases.json",
    });
  }

  return loadProjectLab(repoRoot, labPath, labDir, chapterDir, front, manifest);
}

interface RawLabManifest {
  schemaVersion?: unknown;
  type?: string;
  language?: unknown;
  toolchain?: { standard?: unknown };
  quiz?: { questions?: string };
  targets?: { student?: { sources?: unknown } };
  judge?: { cases?: string };
  buildSystem?: string;
  tasks?: unknown;
}

interface RawProjectTaskEntry {
  id?: unknown;
  path?: unknown;
  weight?: unknown;
  kind?: unknown;
  dependsOn?: unknown;
}

interface RawTaskManifest {
  schemaVersion?: unknown;
  kind?: unknown;
  targets?: { student?: { sources?: unknown } };
  judge?: { kind?: unknown; cases?: unknown };
  ctest?: { tests?: unknown };
  checklist?: unknown;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return undefined;
  return value;
}

function isSafeRelativePath(value: string): boolean {
  if (!value || path.isAbsolute(value)) return false;
  const normalized = path.normalize(value);
  return normalized !== ".." && !normalized.startsWith(`..${path.sep}`) && normalized !== ".";
}

async function isWithinRealDirectory(root: string, candidate: string): Promise<boolean> {
  try {
    const [realRoot, realCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
    const relative = path.relative(realRoot, realCandidate);
    return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  } catch {
    return false;
  }
}

async function collectRegularFiles(root: string, current = root): Promise<string[]> {
  try {
    // lstat 先检查根目录本身，避免 student/ 目录是符号链接时 readdir 跟到 Project 外。
    if (!(await lstat(current)).isDirectory()) return [];
  } catch {
    return [];
  }

  let entries;
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    // Dirent 对符号链接不会报告为 directory/file，因而不会跟随它们越出 Project 根目录。
    if (entry.isDirectory()) {
      files.push(...await collectRegularFiles(root, absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

async function loadProjectLab(
  repoRoot: string,
  labPath: string,
  labDir: string,
  chapterDir: string,
  front: Record<string, unknown>,
  manifest: RawLabManifest,
): Promise<ProjectLab | undefined> {
  const toolchain = manifest.toolchain;
  if (
    manifest.schemaVersion !== 1 ||
    manifest.language !== "cpp" ||
    !toolchain ||
    typeof toolchain !== "object" ||
    Array.isArray(toolchain) ||
    (toolchain.standard !== "c++17" && toolchain.standard !== "c++20") ||
    manifest.buildSystem !== "cmake" ||
    !Array.isArray(manifest.tasks) ||
    manifest.tasks.length === 0
  ) return undefined;

  const tasks: ProjectTask[] = [];
  const studentFiles: ProjectStudentFile[] = [];
  const taskIds = new Set<string>();
  let totalWeight = 0;
  for (const candidate of manifest.tasks) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return undefined;
    const rawEntry = candidate as RawProjectTaskEntry;
    const id = typeof rawEntry.id === "string" ? rawEntry.id : "";
    const relativePath = typeof rawEntry.path === "string" ? rawEntry.path : "";
    const weight = typeof rawEntry.weight === "number" ? rawEntry.weight : NaN;
    const kind = rawEntry.kind;
    if (!/^[a-z][a-z0-9-]*$/.test(id) || taskIds.has(id) || !isSafeRelativePath(relativePath) || !Number.isInteger(weight) || weight < 1 || weight > 100) return undefined;
    if (kind !== "stdio" && kind !== "ctest" && kind !== "manual") return undefined;
    taskIds.add(id);
    totalWeight += weight;

    let taskManifest: RawTaskManifest;
    try {
      taskManifest = await readJson<RawTaskManifest>(path.join(labPath, relativePath, "task.json"));
    } catch {
      return undefined;
    }
    if (
      !taskManifest ||
      typeof taskManifest !== "object" ||
      Array.isArray(taskManifest) ||
      taskManifest.schemaVersion !== 1 ||
      taskManifest.kind !== kind
    ) return undefined;

    const taskPath = path.join(labPath, relativePath);
    // 文本路径安全不等于真实路径安全：task 目录本身也不能是越出 Project 的链接。
    if (!(await isWithinRealDirectory(labPath, taskPath))) return undefined;
    const taskStudentRoot = path.join(taskPath, "student");
    const taskStudentAbsoluteFiles = await collectRegularFiles(taskStudentRoot);
    for (const absolutePath of taskStudentAbsoluteFiles) {
      studentFiles.push({
        taskId: id,
        relativePath: path.relative(labPath, absolutePath).split(path.sep).join("/"),
        absolutePath,
      });
    }

    const dependsOn = rawEntry.dependsOn === undefined ? [] : stringArray(rawEntry.dependsOn);
    if (!dependsOn || new Set(dependsOn).size !== dependsOn.length) return undefined;
    let studentSources: string[] = [];
    const projectTask: ProjectTask = { id, relativePath: relativePath.split(path.sep).join("/"), weight, kind, dependsOn, studentSources };

    if (kind === "stdio") {
      studentSources = stringArray(taskManifest.targets?.student?.sources) ?? [];
      const casesFile = taskManifest.judge?.cases;
      if (
        taskManifest.judge?.kind !== "stdio" ||
        typeof casesFile !== "string" ||
        studentSources.length === 0 ||
        !studentSources.every(isSafeRelativePath) ||
        !isSafeRelativePath(casesFile)
      ) return undefined;
      projectTask.studentSources = studentSources;
      projectTask.cases = await loadTestCasesAt(taskPath, casesFile);
    } else if (kind === "ctest") {
      const rawTests = taskManifest.ctest?.tests;
      if (!Array.isArray(rawTests) || rawTests.length === 0) return undefined;
      const ctestTests: ProjectCtestTest[] = [];
      for (const rawTest of rawTests) {
        if (!rawTest || typeof rawTest !== "object" || Array.isArray(rawTest)) return undefined;
        const test = rawTest as { name?: unknown; points?: unknown };
        if (
          typeof test.name !== "string" ||
          test.name.trim().length === 0 ||
          typeof test.points !== "number" ||
          !Number.isInteger(test.points) ||
          test.points < 1 ||
          ctestTests.some((existing) => existing.name === test.name)
        ) return undefined;
        ctestTests.push({ name: test.name, points: test.points });
      }
      if (ctestTests.reduce((sum, test) => sum + test.points, 0) !== 100) return undefined;
      projectTask.ctestTests = ctestTests;
    } else {
      const checklist = stringArray(taskManifest.checklist);
      if (!checklist || checklist.length === 0 || checklist.some((item) => item.trim().length === 0)) return undefined;
      projectTask.checklist = checklist;
    }

    tasks.push(projectTask);
  }

  if (totalWeight !== 100) return undefined;
  for (const task of tasks) {
    if (task.dependsOn.some((dependency) => !taskIds.has(dependency) || dependency === task.id)) return undefined;
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) {
      if (hasCycle(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  if (tasks.some((task) => hasCycle(task.id))) return undefined;

  return {
    ...buildBase(repoRoot, labPath, labDir, chapterDir, front),
    type: "project",
    buildSystem: "cmake",
    tasks,
    studentFiles: studentFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
  };
}

function buildLab(
  repoRoot: string,
  labPath: string,
  labDir: string,
  chapterDir: string,
  front: Record<string, unknown>,
  details: { type: "program"; studentSources: string[]; casesFile: string } | { type: "quiz"; quizQuestions: QuizQuestion[] },
): ProgramLab | QuizLab {
  return { ...buildBase(repoRoot, labPath, labDir, chapterDir, front), ...details };
}

function buildBase(
  repoRoot: string,
  labPath: string,
  labDir: string,
  chapterDir: string,
  front: Record<string, unknown>,
): LabBase {
  const order = typeof front.order === "number" ? front.order : Number.MAX_SAFE_INTEGER;
  const chapter = parseChapterNumber(front.chapter, chapterDir);
  const slug = labDir.match(/^[TEP]-\d{2}-\d{2,}-(.+)$/)?.[1];
  const legacyNames = slug && Number.isSafeInteger(order) && order !== Number.MAX_SAFE_INTEGER
    ? [`lab-${String(chapter).padStart(2, "0")}-${String(order).padStart(2, "0")}-${slug}`]
    : [];

  return {
    id: readStableLabId(front.labId, labDir),
    name: labDir,
    legacyNames,
    labPath,
    relativePath: path.relative(repoRoot, labPath).split(path.sep).join("/"),
    title: typeof front.title === "string" ? front.title : labDir,
    description: typeof front.description === "string" ? front.description : "",
    chapter,
    chapterTitle: typeof front.chapterTitle === "string" ? front.chapterTitle : chapterDir,
    order,
    difficulty: typeof front.difficulty === "string" ? front.difficulty : undefined,
    duration: typeof front.duration === "string" ? front.duration : undefined,
    status: typeof front.status === "string" ? front.status : undefined,
  };
}

/** 读取公开用例，并把每个用例的输入与期望输出一并载入，供题目面板展示。 */
export async function loadTestCases(
  lab: ProgramLab,
): Promise<LoadedTestCase[]> {
  return loadTestCasesAt(lab.labPath, lab.casesFile);
}

async function loadTestCasesAt(root: string, casesFile: string): Promise<LoadedTestCase[]> {
  if (!isSafeRelativePath(casesFile)) return [];
  let cases: TestCase[];
  try {
    cases = await readJson<TestCase[]>(path.join(root, casesFile));
  } catch {
    return [];
  }

  if (!Array.isArray(cases)) return [];
  const loaded: LoadedTestCase[] = [];
  for (const testCase of cases) {
    if (!testCase || typeof testCase.id !== "string" || typeof testCase.input !== "string" || typeof testCase.expected !== "string") continue;
    const [inputText, expectedText] = await Promise.all([
      isSafeRelativePath(testCase.input) ? readFile(path.join(root, testCase.input), "utf8").catch(() => "") : Promise.resolve(""),
      isSafeRelativePath(testCase.expected) ? readFile(path.join(root, testCase.expected), "utf8").catch(() => "") : Promise.resolve(""),
    ]);
    loaded.push({ ...testCase, inputText, expectedText });
  }
  return loaded;
}

/**
 * 学生作答文件的绝对路径。仅对 program 有意义 —— quiz 在面板里选选项，没有源文件。
 * 当前所有 program lab 都是单文件 student/main.cpp。
 */
export function studentSourcePath(lab: ProgramLab): string {
  return path.join(lab.labPath, lab.studentSources[0]);
}
