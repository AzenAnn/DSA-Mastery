import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { parseQuizQuestions, type QuizQuestion } from "./quiz";
import { readStableLabId } from "./labIdentity";

/**
 * 一道可作答 lab 的静态信息，来自 lab.json 与 README frontmatter。
 *
 * 名字沿用 ProgramLab 是历史原因（最初只支持 program），现在同时承载 quiz。
 * type 决定走哪条判定路径：program 调判题内核，quiz 在扩展内比对选项。
 */
export interface ProgramLab {
  /** 稳定题号，例如 13E01。发布后不随目录或展示顺序改变，用作状态主键。 */
  id: string;
  /** lab 目录名，例如 lab-13-01-container-with-most-water；保留为旧进度迁移别名。 */
  name: string;
  type: "program" | "quiz";
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
  /** student 目标的源文件相对路径，当前全部为单文件 student/main.cpp。 */
  studentSources: string[];
  /** judge.cases 声明的用例清单路径，通常是 tests/cases.json。 */
  casesFile: string;
  quizQuestions?: QuizQuestion[];
}

export interface Chapter {
  chapter: number;
  chapterTitle: string;
  labs: ProgramLab[];
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
 * 扫描 labs/ 下全部 lab，返回 type 为 "program" 或 "quiz" 的题目。
 *
 * program 走判题内核（编译 + 跑用例），quiz 完全在扩展内判定（读 quiz.json、
 * 比对选项），不需要编译器也不调用 CLI。
 *
 * project 含人工评审 task，自动判分无法决定是否完成，因此在这里过滤掉。
 * 只有 README 而没有 lab.json 的目录同样跳过 —— 它们不可运行。
 */
export async function discoverProgramLabs(repoRoot: string): Promise<Chapter[]> {
  const labsRoot = path.join(repoRoot, "labs");
  const labs: ProgramLab[] = [];

  for (const chapterDir of await listDirectories(labsRoot)) {
    const chapterPath = path.join(labsRoot, chapterDir);
    for (const labDir of await listDirectories(chapterPath)) {
      const labPath = path.join(chapterPath, labDir);
      const lab = await loadProgramLab(repoRoot, labPath, labDir, chapterDir);
      if (lab) labs.push(lab);
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
): Promise<ProgramLab | undefined> {
  let manifest: {
    type?: string;
    quiz?: { questions?: string };
    targets?: { student?: { sources?: string[] } };
    judge?: { cases?: string };
  };
  try {
    manifest = await readJson(path.join(labPath, "lab.json"));
  } catch {
    // 没有 lab.json（或无法解析）的目录不可运行，直接跳过。
    return undefined;
  }
  if (manifest.type !== "program" && manifest.type !== "quiz") return undefined;

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
        studentSources: [],
        casesFile: "",
        quizQuestions: questions,
      });
    } catch {
      return undefined;
    }
  }

  const sources = manifest.targets?.student?.sources ?? [];
  if (sources.length === 0) return undefined;

  return buildLab(repoRoot, labPath, labDir, chapterDir, front, {
    type: "program",
    studentSources: sources,
    casesFile: manifest.judge?.cases ?? "tests/cases.json",
  });
}

function buildLab(
  repoRoot: string,
  labPath: string,
  labDir: string,
  chapterDir: string,
  front: Record<string, unknown>,
  details: Pick<ProgramLab, "type" | "studentSources" | "casesFile" | "quizQuestions">,
): ProgramLab {
  return {
    id: readStableLabId(front.labId, labDir),
    name: labDir,
    type: details.type,
    labPath,
    relativePath: path.relative(repoRoot, labPath).split(path.sep).join("/"),
    title: typeof front.title === "string" ? front.title : labDir,
    description: typeof front.description === "string" ? front.description : "",
    chapter: parseChapterNumber(front.chapter, chapterDir),
    chapterTitle: typeof front.chapterTitle === "string" ? front.chapterTitle : chapterDir,
    order: typeof front.order === "number" ? front.order : Number.MAX_SAFE_INTEGER,
    difficulty: typeof front.difficulty === "string" ? front.difficulty : undefined,
    duration: typeof front.duration === "string" ? front.duration : undefined,
    status: typeof front.status === "string" ? front.status : undefined,
    studentSources: details.studentSources,
    casesFile: details.casesFile,
    quizQuestions: details.quizQuestions,
  };
}

/** 读取公开用例，并把每个用例的输入与期望输出一并载入，供题目面板展示。 */
export async function loadTestCases(
  lab: ProgramLab,
): Promise<Array<TestCase & { inputText: string; expectedText: string }>> {
  let cases: TestCase[];
  try {
    cases = await readJson<TestCase[]>(path.join(lab.labPath, lab.casesFile));
  } catch {
    return [];
  }

  const loaded = [];
  for (const testCase of cases) {
    const [inputText, expectedText] = await Promise.all([
      readFile(path.join(lab.labPath, testCase.input), "utf8").catch(() => ""),
      readFile(path.join(lab.labPath, testCase.expected), "utf8").catch(() => ""),
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
