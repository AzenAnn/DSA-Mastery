import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

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

async function findFiles(root, predicate) {
  const results = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) results.push(...(await findFiles(fullPath, predicate)));
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
  if (!/^\d+$/.test(parsed.data.chapter) || !/^\d+$/.test(parsed.data.order)) {
    throw new Error(`${relativePath}: chapter 与 order 必须是非负整数`);
  }
  if (kind === "lesson" && !/^content\/chapter-\d{2}-[a-z0-9-]+\/\d{2}-[a-z0-9-]+\.md$/.test(relativePath)) {
    throw new Error(`${relativePath}: 教材路径不符合 chapter-NN/NN-slug.md 约定`);
  }
  if (kind === "lab") {
    for (const field of ["lab", "difficulty", "duration"]) {
      if (!parsed.data[field]) throw new Error(`${relativePath}: Lab 缺少字段 ${field}`);
    }
  }
  const orderKey = `${kind}:${parsed.data.chapter}:${parsed.data.order}`;
  if (seenOrder.has(orderKey)) throw new Error(`${relativePath}: chapter + order 与另一文件重复`);
  seenOrder.add(orderKey);
}

async function validateLinks(file, source) {
  const relativeLinks = [...source.matchAll(/\]\(([^)]+\.md(?:#[^)]*)?)\)/g)].map((match) => match[1]);
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

const lessonRoot = path.join(projectRoot, "content");
const labRoot = path.join(projectRoot, "labs");
const lessonFiles = (await findFiles(lessonRoot, (file) => file.endsWith(".md")))
  .filter((file) => path.basename(file).toLowerCase() !== "readme.md");
const labFiles = await findFiles(labRoot, (file) => path.basename(file).toLowerCase() === "readme.md");

const seenOrder = new Set();
for (const [kind, files] of [["lesson", lessonFiles], ["lab", labFiles]]) {
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const parsed = parseFrontmatter(source, path.relative(projectRoot, file));
    assertFileContract(file, kind, parsed, seenOrder);
    await validateLinks(file, source);
  }
}

if (!lessonFiles.length) throw new Error("content/ 中没有可渲染的教材页面");
console.log(`内容检查通过：${lessonFiles.length} 篇教材页面，${labFiles.length} 个 Lab。`);
