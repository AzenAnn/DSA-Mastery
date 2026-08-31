import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { LabError } from "./errors.mjs";
import { formatLabId, normalizeLabId, parseLabId } from "./lab-id.mjs";

export { formatLabDocumentTitlePrefix, formatLabId, normalizeLabId, parseLabId } from "./lab-id.mjs";

export const LAB_TYPE_TO_TAG = Object.freeze({ quiz: "T", program: "E", project: "P" });
export const LAB_TYPE_TO_CATEGORY = Object.freeze({ quiz: "theory", program: "exercise", project: "project" });
export const LAB_CATEGORY_TO_TAG = Object.freeze({ theory: "T", exercise: "E", project: "P" });

export const LAB_DIRECTORY_PATTERN = /^lab-\d{2}-(?:\d{2}|[TEP]-\d{2,})-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const LEGACY_LAB_DIRECTORY_PATTERN = /^lab-(\d{2})-(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
export const STABLE_LAB_DIRECTORY_PATTERN = /^lab-(\d{2})-([TEP])-(\d{2,})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

function integer(value, label, minimum = 0) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new LabError("ARGUMENT_INVALID", `${label} 必须是大于等于 ${minimum} 的整数`);
  }
  return parsed;
}

export function tagForType(type) {
  const tag = LAB_TYPE_TO_TAG[type];
  if (!tag) throw new LabError("ARGUMENT_INVALID", "--type 必须是 quiz、program 或 project");
  return tag;
}

export function categoryForType(type) {
  return LAB_TYPE_TO_CATEGORY[type];
}

export function tagForCategory(category) {
  return LAB_CATEGORY_TO_TAG[category];
}

export function insertLabIdFrontmatter(source, value) {
  const labId = normalizeLabId(value);
  let foundChapter = false;
  const updated = String(source).replace(
    /^(chapter:\s*[^\r\n]+)(\r?\n)/m,
    (_match, chapterLine, newline) => {
      foundChapter = true;
      return `${chapterLine}${newline}labId: "${labId}"${newline}`;
    },
  );
  if (!foundChapter) {
    throw new LabError("FRONTMATTER_INVALID", "README frontmatter 中缺少 chapter，无法插入 labId");
  }
  return updated;
}

async function readManifestType(labPath) {
  try {
    const manifest = JSON.parse(await readFile(path.join(labPath, "lab.json"), "utf8"));
    if (!LAB_TYPE_TO_TAG[manifest.type]) {
      throw new LabError("LAB_TYPE_INVALID", `${path.join(labPath, "lab.json")}: type 必须是 quiz、program 或 project`);
    }
    return manifest.type;
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    if (error instanceof LabError) throw error;
    throw new LabError("JSON_INVALID", `${path.join(labPath, "lab.json")}: 无法解析 JSON`, { cause: error });
  }
}

export async function scanLabRecords(root, options = {}) {
  const labsRoot = path.join(root, "labs");
  let chapterEntries;
  try {
    chapterEntries = await readdir(labsRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const records = [];
  for (const chapterEntry of chapterEntries) {
    const chapterMatch = chapterEntry.isDirectory() && chapterEntry.name.match(/^chapter-(\d{2})$/);
    if (!chapterMatch) continue;
    const pathChapter = Number(chapterMatch[1]);
    if (options.chapter !== undefined && pathChapter !== Number(options.chapter)) continue;

    const chapterPath = path.join(labsRoot, chapterEntry.name);
    for (const labEntry of await readdir(chapterPath, { withFileTypes: true })) {
      if (!labEntry.isDirectory() || !LAB_DIRECTORY_PATTERN.test(labEntry.name)) continue;
      const labPath = path.join(chapterPath, labEntry.name);
      const readmePath = path.join(labPath, "README.md");
      let source;
      try {
        source = await readFile(readmePath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      const parsed = matter(source);
      const type = await readManifestType(labPath);
      const category = type ? categoryForType(type) : String(parsed.data.labCategory ?? "").trim();
      records.push({
        labPath,
        readmePath,
        relativePath: path.relative(root, labPath).split(path.sep).join("/"),
        directoryName: labEntry.name,
        pathChapter,
        frontmatter: parsed.data,
        type,
        category: category || undefined,
        labId: typeof parsed.data.labId === "string" ? parsed.data.labId.trim() : "",
        order: Number(parsed.data.order),
      });
    }
  }
  return records;
}

function validateRecordIdentity(record) {
  if (!record.labId) {
    throw new LabError("LAB_ID_MISSING", `${record.relativePath}/README.md: 缺少 labId`);
  }
  const parsed = parseLabId(record.labId);
  if (parsed.id !== record.labId) {
    throw new LabError("LAB_ID_NOT_CANONICAL", `${record.relativePath}/README.md: labId 应写为 ${parsed.id}`);
  }
  if (parsed.chapter !== record.pathChapter) {
    throw new LabError("LAB_ID_CHAPTER_MISMATCH", `${record.relativePath}/README.md: labId 章节与目录不一致`);
  }
  const expectedTag = tagForCategory(record.category);
  if (!expectedTag) {
    throw new LabError("LAB_CATEGORY_MISSING", `${record.relativePath}/README.md: 无法确定 Theory、Exercise 或 Project 分类`);
  }
  if (parsed.tag !== expectedTag) {
    throw new LabError(
      "LAB_ID_TYPE_MISMATCH",
      `${record.relativePath}/README.md: ${record.labId} 与 ${record.category} 分类不一致，应使用 ${expectedTag}`,
    );
  }
  return parsed;
}

export async function allocateLabIdentity(root, options) {
  const chapter = integer(options.chapter, "--chapter", 0);
  if (chapter > 99) throw new LabError("ARGUMENT_INVALID", "--chapter 必须是 0～99 的整数");
  const tag = tagForType(options.type);
  const records = await scanLabRecords(root, { chapter });
  const seen = new Set();
  let maxSequence = 0;
  let maxOrder = 0;
  for (const record of records) {
    const parsed = validateRecordIdentity(record);
    if (seen.has(parsed.id)) throw new LabError("LAB_ID_DUPLICATE", `稳定 ID 重复：${parsed.id}`);
    seen.add(parsed.id);
    if (parsed.tag === tag) maxSequence = Math.max(maxSequence, parsed.sequence);
    if (Number.isInteger(record.order) && record.order >= 0) maxOrder = Math.max(maxOrder, record.order);
  }
  const sequence = maxSequence + 1;
  const order = options.order === undefined ? maxOrder + 1 : integer(options.order, "--order", 0);
  if (options.order !== undefined && records.some((record) => record.order === order)) {
    throw new LabError("ORDER_DUPLICATE", `第 ${chapter} 章已经使用展示顺序 ${order}`);
  }
  return { id: formatLabId(chapter, tag, sequence), chapter, tag, sequence, order };
}

export async function locateLabById(root, value) {
  const id = normalizeLabId(value);
  const matches = [];
  for (const record of await scanLabRecords(root)) {
    if (!record.labId) continue;
    if (normalizeLabId(record.labId) === id) matches.push(record);
  }
  if (matches.length === 0) throw new LabError("LAB_ID_NOT_FOUND", `没有找到 Lab：${id}`);
  if (matches.length > 1) {
    throw new LabError("LAB_ID_DUPLICATE", `稳定 ID ${id} 对应多个目录：${matches.map((item) => item.relativePath).join("、")}`);
  }
  return { id, ...matches[0] };
}
