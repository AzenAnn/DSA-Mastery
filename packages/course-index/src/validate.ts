import type { LabCategory } from "@dsa/lab-core";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  assertNoLeakedExportPhrases,
  categoryForType,
  countQuizMounts,
  formatLabDocumentTitlePrefix,
  isLabType,
  LAB_CATEGORIES,
  LAB_DIRECTORY_PATTERN,
  loadLab,
  parseLabDirectoryName,
  parseLabId,
  parseQuizQuestions,
  tagForCategory,
  validateQuizReadme,
} from "@dsa/lab-core";
import matter from "gray-matter";

export interface Violation {
  rule: string;
  file: string;
  message: string;
}

export interface ContentCorpus {
  lessonCount: number;
  labCount: number;
  manifestCount: number;
  interactiveQuizCount: number;
  violations: Violation[];
  /** 按规则取出全部违规；测试里一条规则一个断言，一次报完所有出问题的文件。 */
  of: (rule: string) => Violation[];
  rules: string[];
}

interface ParsedDocument {
  data: Record<string, unknown>;
  body: string;
}

const REQUIRED_FIELDS = [
  "title",
  "description",
  "order",
  "chapter",
  "chapterTitle",
  "updated",
  "contributors",
  "status",
];
const VALID_STATUSES = new Set(["draft", "review", "published"]);
const PREFACE_LESSON = /^content\/chapter-preface\/\d{2}-[a-z0-9-]+\.md$/;
const LESSON_PATH = /^content\/chapter-\d{2}-[a-z0-9-]+\/\d{2}-[a-z0-9-]+\.md$/;
/** 这些章节已经完成三级目录迁移，README-only Lab 必须显式声明分类。 */
const CATEGORIZED_CHAPTERS = new Set([1, 2, 3, 4, 5, 8, 9]);

const RULES = [
  "lab-layout",
  "required-fields",
  "status-enum",
  "updated-format",
  "order-format",
  "chapter-format",
  "lesson-path",
  "lab-fields",
  "lab-id",
  "lab-directory",
  "lab-title",
  "order-unique",
  "links",
  "quiz",
  "manifest",
] as const;

class Collector {
  readonly violations: Violation[] = [];
  readonly root: string;

  // 不用构造函数参数属性：Node 的类型剥离不支持这种非可擦除语法。
  constructor(root: string) {
    this.root = root;
  }

  relative(file: string): string {
    return path.relative(this.root, file).replaceAll("\\", "/");
  }

  add(rule: string, file: string, message: string): void {
    this.violations.push({ rule, file: this.relative(file), message });
  }

  /** 把一段会抛错的校验收敛成违规记录，让同一轮扫描能跑完全部文件。 */
  async guard(rule: string, file: string, check: () => void | Promise<void>): Promise<void> {
    try {
      await check();
    } catch (error) {
      this.add(rule, file, error instanceof Error ? error.message : String(error));
    }
  }
}

async function findFiles(root: string, predicate: (file: string) => boolean): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory() && entry.name !== ".lab-cache") results.push(...(await findFiles(full, predicate)));
    else if (predicate(full)) results.push(full);
  }

  return results;
}

async function checkLabLayout(collector: Collector, labRoot: string): Promise<void> {
  for (const chapter of await readdir(labRoot, { withFileTypes: true })) {
    if (!chapter.isDirectory()) continue;
    const chapterRoot = path.join(labRoot, chapter.name);
    if (!/^chapter-\d{2}$/.test(chapter.name)) {
      collector.add("lab-layout", chapterRoot, "章节目录应为 chapter-CC");
      continue;
    }
    const chapterEntries = await readdir(chapterRoot, { withFileTypes: true });
    for (const entry of chapterEntries) {
      if (entry.isDirectory() && !LAB_CATEGORIES.includes(entry.name as LabCategory)) {
        collector.add("lab-layout", path.join(chapterRoot, entry.name), "Lab 必须放在 theory、exercise 或 project 中");
      }
    }
    for (const category of LAB_CATEGORIES) {
      const categoryRoot = path.join(chapterRoot, category);
      let entries;
      try {
        entries = await readdir(categoryRoot, { withFileTypes: true });
      } catch {
        collector.add("lab-layout", categoryRoot, "每章必须保留三个分类目录");
        continue;
      }
      const labDirectories = entries.filter((entry) => entry.isDirectory());
      for (const entry of labDirectories) {
        if (!LAB_DIRECTORY_PATTERN.test(entry.name)) {
          collector.add("lab-layout", path.join(categoryRoot, entry.name), "Lab 目录应为 X-CC-SS-kebab-slug");
        }
      }
      const marker = entries.some((entry) => entry.isFile() && entry.name === ".gitkeep");
      if (labDirectories.length === 0 && !marker)
        collector.add("lab-layout", categoryRoot, "空分类必须使用 .gitkeep 保留目录");
      if (labDirectories.length > 0 && marker)
        collector.add("lab-layout", categoryRoot, "已有 Lab 时必须移除 .gitkeep");
    }
  }
}

function checkFrontmatter(collector: Collector, file: string, kind: "lesson" | "lab", parsed: ParsedDocument): void {
  const relativePath = collector.relative(file);
  const data = parsed.data;
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === "")
      collector.add("required-fields", file, `缺少必填字段 ${field}`);
  }
  if (!VALID_STATUSES.has(String(data["status"])))
    collector.add("status-enum", file, "status 必须是 draft、review 或 published");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data["updated"])))
    collector.add("updated-format", file, "updated 必须使用 YYYY-MM-DD");
  if (!Number.isInteger(Number(data["order"])) || Number(data["order"]) < 0) {
    collector.add("order-format", file, "order 必须是非负整数");
  }
  const isPrefaceLesson = kind === "lesson" && PREFACE_LESSON.test(relativePath);
  if (data["chapter"] === "preface") {
    if (!isPrefaceLesson || data["chapterTitle"] !== "课程作者指南") {
      collector.add("chapter-format", file, "preface 仅允许用于 chapter-preface 下的课程作者指南");
    }
  } else if (!Number.isInteger(Number(data["chapter"])) || Number(data["chapter"]) < 0) {
    collector.add("chapter-format", file, "chapter 必须是非负整数或受支持的 preface");
  }
  if (kind === "lesson" && !isPrefaceLesson && !LESSON_PATH.test(relativePath)) {
    collector.add("lesson-path", file, "教材路径不符合 chapter-NN/NN-slug.md 或 chapter-preface 特例约定");
  }
}

function checkLabIdentity(
  collector: Collector,
  file: string,
  parsed: ParsedDocument,
  labCategory: string | undefined,
  seenLabIds: Map<string, string>,
): void {
  const data = parsed.data;
  for (const field of ["lab", "difficulty", "duration"]) {
    if (data[field] === undefined) collector.add("lab-fields", file, `Lab 缺少字段 ${field}`);
  }
  if (data["labCategory"] !== undefined && !LAB_CATEGORIES.includes(data["labCategory"] as LabCategory)) {
    collector.add("lab-fields", file, "labCategory 必须是 theory、exercise 或 project");
  }
  if (data["labId"] === undefined) {
    collector.add("lab-id", file, "Lab 缺少稳定编号 labId");

    return;
  }
  let identity;
  try {
    identity = parseLabId(data["labId"]);
  } catch (error) {
    collector.add("lab-id", file, (error as Error).message);

    return;
  }
  if (identity.id !== data["labId"]) collector.add("lab-id", file, `labId 必须使用规范形式 ${identity.id}`);
  if (identity.chapter !== Number(data["chapter"]))
    collector.add("lab-id", file, "labId 章节必须与 frontmatter chapter 一致");
  const expectedTag = tagForCategory(labCategory);
  if (!expectedTag || identity.tag !== expectedTag) {
    collector.add("lab-id", file, `labId 标签必须与 ${labCategory ?? "未分类"} 类型一致`);
  }
  const previous = seenLabIds.get(identity.id);
  if (previous !== undefined) collector.add("lab-id", file, `labId ${identity.id} 与 ${previous} 重复`);
  seenLabIds.set(identity.id, collector.relative(file));

  const directoryName = path.basename(path.dirname(file));
  const categoryDirectory = path.basename(path.dirname(path.dirname(file)));
  const chapterMatch = path.basename(path.dirname(path.dirname(path.dirname(file)))).match(/^chapter-(\d{2})$/);
  if (!chapterMatch || Number(chapterMatch[1]) !== Number(data["chapter"])) {
    collector.add("lab-directory", file, "chapter 目录必须与 frontmatter chapter 一致");
  }
  if (!LAB_CATEGORIES.includes(categoryDirectory as LabCategory) || categoryDirectory !== labCategory) {
    collector.add("lab-directory", file, `分类目录必须与 ${labCategory ?? "未分类"} 类型一致`);
  }
  try {
    if (parseLabDirectoryName(directoryName).id !== identity.id) {
      collector.add("lab-directory", file, `目录编号必须与 labId ${identity.id} 一致`);
    }
  } catch (error) {
    collector.add("lab-directory", file, (error as Error).message);
  }

  const titlePrefix = formatLabDocumentTitlePrefix(identity.id);
  const title = String(data["title"] ?? "");
  if (!title.startsWith(titlePrefix)) collector.add("lab-title", file, `title 必须以 ${titlePrefix} 开头`);
  else if (!title.slice(titlePrefix.length).trim()) collector.add("lab-title", file, "title 的编号后必须包含题目名称");
  if (!parsed.body.includes(`# ${title}`)) collector.add("lab-title", file, "H1 必须与 frontmatter title 一致");
}

async function resolveLabCategory(
  collector: Collector,
  file: string,
  parsed: ParsedDocument,
): Promise<string | undefined> {
  const manifestPath = path.join(path.dirname(file), "lab.json");
  let source: string;
  try {
    source = await readFile(manifestPath, "utf8");
  } catch {
    return parsed.data["labCategory"] as string | undefined;
  }
  const type = (JSON.parse(source) as { type?: unknown }).type;
  if (!isLabType(type)) {
    collector.add("manifest", file, "lab.json.type 必须是 quiz、program 或 project");

    return undefined;
  }

  return categoryForType(type);
}

async function checkLinks(collector: Collector, file: string, source: string): Promise<void> {
  const relativeLinks = [...source.matchAll(/\]\(([^)]+\.md(?:#[^)]*)?)\)/g)]
    .map((match) => match[1]!)
    .filter((href) => !/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith("/"));
  for (const href of relativeLinks) {
    const target = path.resolve(path.dirname(file), decodeURIComponent(href.split("#", 1)[0]!));
    try {
      await access(target);
    } catch {
      collector.add("links", file, `相对链接不存在 -> ${href}`);
    }
  }
}

async function checkQuizLab(collector: Collector, file: string, readme: string): Promise<number> {
  const quizPath = path.join(path.dirname(file), "quiz.json");
  let quizSource: string;
  try {
    quizSource = await readFile(quizPath, "utf8");
  } catch {
    if (countQuizMounts(readme)) collector.add("quiz", file, "使用了 QuizSet 但缺少同目录 quiz.json");

    return 0;
  }
  try {
    await access(path.join(path.dirname(file), "lab.json"));
  } catch {
    collector.add("quiz", file, "交互 Quiz Lab 必须提供 schemaVersion 1 的 lab.json");
  }
  let count = 0;
  await collector.guard("quiz", file, () => {
    validateQuizReadme(readme, collector.relative(file));
  });
  await collector.guard("quiz", quizPath, () => {
    count = parseQuizQuestions(JSON.parse(quizSource), collector.relative(quizPath)).length;
    assertNoLeakedExportPhrases(quizSource, collector.relative(quizPath));
  });

  return count;
}

export async function loadContentCorpus(root: string): Promise<ContentCorpus> {
  const collector = new Collector(root);
  const lessonRoot = path.join(root, "content");
  const labRoot = path.join(root, "labs");
  await checkLabLayout(collector, labRoot);

  const lessonFiles = (await findFiles(lessonRoot, (file) => file.endsWith(".md"))).filter(
    (file) => path.basename(file).toLowerCase() !== "readme.md",
  );
  const labFiles = (await findFiles(labRoot, (file) => path.basename(file).toLowerCase() === "readme.md")).filter(
    (file) => LAB_DIRECTORY_PATTERN.test(path.basename(path.dirname(file))),
  );
  const manifestFiles = (await findFiles(labRoot, (file) => path.basename(file).toLowerCase() === "lab.json")).filter(
    (file) => LAB_DIRECTORY_PATTERN.test(path.basename(path.dirname(file))),
  );

  const seenOrder = new Map<string, string>();
  const seenLabIds = new Map<string, string>();
  let interactiveQuizCount = 0;

  for (const [kind, files] of [
    ["lesson", lessonFiles],
    ["lab", labFiles],
  ] as const) {
    for (const file of files) {
      const source = await readFile(file, "utf8");
      const { data, content } = matter(source);
      const parsed: ParsedDocument = { data, body: content };
      checkFrontmatter(collector, file, kind, parsed);
      if (kind === "lab") {
        const labCategory = await resolveLabCategory(collector, file, parsed);
        checkLabIdentity(collector, file, parsed, labCategory, seenLabIds);
        if (CATEGORIZED_CHAPTERS.has(Number(parsed.data["chapter"])) && parsed.data["labCategory"] === undefined) {
          const hasManifest = await access(path.join(path.dirname(file), "lab.json")).then(
            () => true,
            () => false,
          );
          if (!hasManifest) collector.add("lab-fields", file, "分类章节 README-only Lab 必须显式声明 labCategory");
        }
        interactiveQuizCount += await checkQuizLab(collector, file, source);
      }
      const orderKey = `${kind}:${String(parsed.data["chapter"])}:${String(parsed.data["order"])}`;
      const previous = seenOrder.get(orderKey);
      if (previous !== undefined) collector.add("order-unique", file, `chapter + order 与 ${previous} 重复`);
      seenOrder.set(orderKey, collector.relative(file));
      await checkLinks(collector, file, source);
    }
  }

  for (const manifestFile of manifestFiles) {
    await collector.guard("manifest", manifestFile, async () => {
      await loadLab(path.dirname(manifestFile));
    });
  }
  if (!lessonFiles.length) collector.add("required-fields", lessonRoot, "content/ 中没有可渲染的教材页面");

  return {
    lessonCount: lessonFiles.length,
    labCount: labFiles.length,
    manifestCount: manifestFiles.length,
    interactiveQuizCount,
    violations: collector.violations,
    of: (rule) => collector.violations.filter((violation) => violation.rule === rule),
    rules: [...RULES],
  };
}
