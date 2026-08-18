import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadLab, validateQuizReadme } from "../tools/lab/core.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const requiredFields = [
  "title",
  "description",
  "order",
  "chapter",
  "chapterTitle",
  "updated",
  "contributors",
  "status",
];
const validStatuses = new Set(["draft", "review", "published"]);
const validLabCategories = new Set(["theory", "exercise", "project"]);
const prefaceLessonPattern = /^content\/chapter-preface\/\d{2}-[a-z0-9-]+\.md$/;

async function findFiles(root, predicate) {
  const results = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory() && entry.name !== ".lab-cache") results.push(...(await findFiles(fullPath, predicate)));
    else if (predicate(fullPath)) results.push(fullPath);
  }
  return results;
}

function parseFrontmatter(source, relativePath) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) throw new Error(`${relativePath}: 缺少 YAML frontmatter`);
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    data[key] = raw.replace(/^(["'])(.*)\1$/, "$2");
  }
  return { data, body: source.slice(match[0].length) };
}

function assertFileContract(file, kind, parsed, seenOrder) {
  const relativePath = path.relative(projectRoot, file).replaceAll("\\", "/");
  for (const field of requiredFields) {
    if (!parsed.data[field]) throw new Error(`${relativePath}: 缺少必填字段 ${field}`);
  }
  if (!validStatuses.has(parsed.data.status)) {
    throw new Error(`${relativePath}: status 必须是 draft、review 或 published`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.data.updated)) {
    throw new Error(`${relativePath}: updated 必须使用 YYYY-MM-DD`);
  }
  if (!/^\d+$/.test(parsed.data.order)) {
    throw new Error(`${relativePath}: order 必须是非负整数`);
  }
  const isPrefaceLesson = kind === "lesson" && prefaceLessonPattern.test(relativePath);
  if (parsed.data.chapter === "preface") {
    if (!isPrefaceLesson || parsed.data.chapterTitle !== "课程作者指南") {
      throw new Error(`${relativePath}: preface 仅允许用于 chapter-preface 下的课程作者指南`);
    }
  } else if (!/^\d+$/.test(parsed.data.chapter)) {
    throw new Error(`${relativePath}: chapter 必须是非负整数或受支持的 preface`);
  }
  if (
    kind === "lesson" &&
    !isPrefaceLesson &&
    !/^content\/chapter-\d{2}-[a-z0-9-]+\/\d{2}-[a-z0-9-]+\.md$/.test(relativePath)
  ) {
    throw new Error(`${relativePath}: 教材路径不符合 chapter-NN/NN-slug.md 或 chapter-preface 特例约定`);
  }
  if (kind === "lab") {
    for (const field of ["lab", "difficulty", "duration"]) {
      if (!parsed.data[field]) throw new Error(`${relativePath}: Lab 缺少字段 ${field}`);
    }
    if (parsed.data.labCategory && !validLabCategories.has(parsed.data.labCategory)) {
      throw new Error(`${relativePath}: labCategory 必须是 theory、exercise 或 project`);
    }
    const pathMatch = relativePath.match(
      /^labs\/chapter-(\d{2})\/lab-(\d{2})-(\d{2})-[a-z0-9-]+\/README\.md$/,
    );
    if (
      !pathMatch ||
      Number(pathMatch[1]) !== Number(parsed.data.chapter) ||
      Number(pathMatch[2]) !== Number(parsed.data.chapter) ||
      Number(pathMatch[3]) !== Number(parsed.data.order)
    ) {
      throw new Error(`${relativePath}: 目录编号必须与 frontmatter chapter/order 一致`);
    }
    const expectedTitlePrefix = `Lab ${pathMatch[2]}-${pathMatch[3]}：`;
    if (!parsed.data.title.startsWith(expectedTitlePrefix)) {
      throw new Error(`${relativePath}: title 必须以 ${expectedTitlePrefix} 开头`);
    }
    if (!parsed.body.includes(`# ${parsed.data.title}`)) {
      throw new Error(`${relativePath}: H1 必须与 frontmatter title 一致`);
    }
  }
  const orderKey = `${kind}:${parsed.data.chapter}:${parsed.data.order}`;
  if (seenOrder.has(orderKey)) throw new Error(`${relativePath}: chapter + order 与另一文件重复`);
  seenOrder.add(orderKey);
}

async function validateLinks(file, source) {
  const relativeLinks = [...source.matchAll(/\]\(([^)]+\.md(?:#[^)]*)?)\)/g)]
    .map((match) => match[1])
    .filter((href) => !/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith("/"));
  for (const href of relativeLinks) {
    const filePart = decodeURIComponent(href.split("#", 1)[0]);
    const target = path.resolve(path.dirname(file), filePart);
    try {
      await access(target);
    } catch {
      throw new Error(`${path.relative(projectRoot, file)}: 相对链接不存在 -> ${href}`);
    }
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertOptionalString(value, field, label) {
  if (value !== undefined && (typeof value !== "string" || !value.trim())) {
    throw new Error(`${label}: ${field} 必须是非空字符串`);
  }
}

async function validateQuizLab(file, readme) {
  const relativeReadme = path.relative(projectRoot, file).replaceAll("\\", "/");
  const quizPath = path.join(path.dirname(file), "quiz.json");
  let quizSource;
  try {
    quizSource = await readFile(quizPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const mountCount = [...readme.matchAll(/<QuizSet\s*\/>/g)].length;
  if (quizSource === undefined) {
    if (mountCount) throw new Error(`${relativeReadme}: 使用了 QuizSet 但缺少同目录 quiz.json`);
    return 0;
  }
  const relativeQuiz = path.relative(projectRoot, quizPath).replaceAll("\\", "/");
  try {
    await access(path.join(path.dirname(file), "lab.json"));
  } catch {
    throw new Error(`${relativeReadme}: 交互 Quiz Lab 必须提供 schemaVersion 1 的 lab.json`);
  }
  validateQuizReadme(readme, relativeReadme);

  let parsed;
  try {
    parsed = JSON.parse(quizSource);
  } catch (error) {
    throw new Error(`${relativeQuiz}: JSON 解析失败：${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${relativeQuiz}: 顶层必须是非空题目数组`);
  }

  const ids = new Set();
  parsed.forEach((question, index) => {
    const label = `${relativeQuiz}: 第 ${index + 1} 题`;
    if (!isRecord(question)) throw new Error(`${label} 必须是对象`);
    for (const field of ["id", "stem", "explanation"]) {
      if (typeof question[field] !== "string" || !question[field].trim()) {
        throw new Error(`${label}: ${field} 必须是非空字符串`);
      }
    }
    if (ids.has(question.id)) throw new Error(`${label}: id ${question.id} 重复`);
    ids.add(question.id);
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(`${label}: options 必须恰好包含 4 项`);
    }
    if (question.options.some((option) => typeof option !== "string" || !option.trim())) {
      throw new Error(`${label}: 每个选项都必须是非空字符串`);
    }
    const normalizedOptions = question.options.map((option, optionIndex) => {
      const trimmed = option.trim();
      if (/^[A-DＡ-Ｄ][.．、:：)）]\s*/i.test(trimmed)) {
        throw new Error(`${label}: 选项 ${optionIndex + 1} 不要手写 A、B、C、D 前缀`);
      }
      return trimmed.replace(/\s+/gu, " ").toLocaleLowerCase();
    });
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      throw new Error(`${label}: 选项内容不得重复`);
    }
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
      throw new Error(`${label}: answer 必须是 0～3 的整数`);
    }
    for (const field of ["title", "source", "difficulty", "targetId", "code", "hint"]) {
      assertOptionalString(question[field], field, label);
    }
    if (question.points !== undefined && (!Number.isInteger(question.points) || question.points <= 0)) {
      throw new Error(`${label}: points 必须是正整数`);
    }
    if (
      question.topics !== undefined &&
      (!Array.isArray(question.topics) ||
        question.topics.some((topic) => typeof topic !== "string" || !topic.trim()))
    ) {
      throw new Error(`${label}: topics 必须是非空字符串数组`);
    }
  });

  for (const forbidden of ["查看原始页面", "看交互可视化", "答案来源说明", "Codex 基于题面独立推理补全"]) {
    if (quizSource.includes(forbidden)) throw new Error(`${relativeQuiz}: 含课程站点禁用的个人导出内容“${forbidden}”`);
  }
  return parsed.length;
}

const lessonRoot = path.join(projectRoot, "content");
const labRoot = path.join(projectRoot, "labs");
const lessonFiles = (await findFiles(lessonRoot, (file) => file.endsWith(".md")))
  .filter((file) => path.basename(file).toLowerCase() !== "readme.md");
const labFiles = (await findFiles(labRoot, (file) => path.basename(file).toLowerCase() === "readme.md"))
  .filter((file) => /^labs\/chapter-\d{2}\/lab-\d{2}-\d{2}-[a-z0-9-]+\/README\.md$/i.test(
    path.relative(projectRoot, file).replaceAll("\\", "/"),
  ));
const manifestFiles = (await findFiles(labRoot, (file) => path.basename(file).toLowerCase() === "lab.json"))
  .filter((file) => /^labs\/chapter-\d{2}\/lab-\d{2}-\d{2}-[a-z0-9-]+\/lab\.json$/i.test(
    path.relative(projectRoot, file).replaceAll("\\", "/"),
  ));

const seenOrder = new Set();
let interactiveQuizCount = 0;
for (const [kind, files] of [["lesson", lessonFiles], ["lab", labFiles]]) {
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const parsed = parseFrontmatter(source, path.relative(projectRoot, file));
    assertFileContract(file, kind, parsed, seenOrder);
    if (kind === "lab" && parsed.data.chapter === "1") {
      let hasManifest = true;
      try {
        await access(path.join(path.dirname(file), "lab.json"));
      } catch {
        hasManifest = false;
      }
      if (!hasManifest && !parsed.data.labCategory) {
        throw new Error(`${path.relative(projectRoot, file)}: 第 1 章 README-only Lab 必须显式声明 labCategory`);
      }
    }
    await validateLinks(file, source);
    if (kind === "lab") interactiveQuizCount += await validateQuizLab(file, source);
  }
}

for (const manifestFile of manifestFiles) await loadLab(path.dirname(manifestFile));

if (!lessonFiles.length) throw new Error("content/ 中没有可渲染的教材页面");
console.log(
  `内容检查通过：${lessonFiles.length} 篇教材页面，${labFiles.length} 个 Lab，${manifestFiles.length} 个新式 manifest，${interactiveQuizCount} 道交互选择题。`,
);
