import type { LabCategory, LabDirectoryIdentity, LabTag, LabType, ParsedLabId } from "@dsa/lab-core";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  CHAPTER_DIRECTORY_PATTERN,
  formatLabId,
  integer,
  isLabType,
  LAB_CATEGORIES,
  LAB_DIRECTORY_PATTERN,
  LabError,
  normalizeLabId,
  parseFrontmatter,
  parseLabDirectoryName,
  parseLabId,
  categoryForType,
  tagForCategory,
  tagForType,
} from "@dsa/lab-core";

export interface LabRecord {
  labPath: string;
  readmePath: string;
  relativePath: string;
  directoryName: string;
  directoryIdentity: LabDirectoryIdentity;
  pathChapter: number;
  categoryDirectory: LabCategory;
  type?: LabType | undefined;
  category?: string | undefined;
  labId: string;
  order: number;
}

async function readManifestType(labPath: string): Promise<LabType | undefined> {
  const manifestPath = path.join(labPath, "lab.json");
  let source: string;
  try {
    source = await readFile(manifestPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return undefined;
    throw error;
  }
  let manifest: { type?: unknown };
  try {
    manifest = JSON.parse(source) as { type?: unknown };
  } catch (error) {
    throw new LabError("JSON_INVALID", `${manifestPath}: 无法解析 JSON`, { cause: error });
  }
  if (!isLabType(manifest.type)) {
    throw new LabError("LAB_TYPE_INVALID", `${manifestPath}: type 必须是 quiz、program 或 project`);
  }

  return manifest.type;
}

export async function scanLabRecords(root: string, options: { chapter?: number } = {}): Promise<LabRecord[]> {
  const labsRoot = path.join(root, "labs");
  let chapterEntries;
  try {
    chapterEntries = await readdir(labsRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw error;
  }

  const records: LabRecord[] = [];
  for (const chapterEntry of chapterEntries) {
    const chapterMatch = chapterEntry.isDirectory() ? chapterEntry.name.match(CHAPTER_DIRECTORY_PATTERN) : null;
    if (chapterMatch === null) continue;
    const pathChapter = Number(chapterMatch[1]);
    if (options.chapter !== undefined && pathChapter !== Number(options.chapter)) continue;

    const chapterPath = path.join(labsRoot, chapterEntry.name);
    for (const child of await readdir(chapterPath, { withFileTypes: true })) {
      if (child.isDirectory() && !LAB_CATEGORIES.includes(child.name as LabCategory)) {
        const relative = path.relative(root, path.join(chapterPath, child.name)).split(path.sep).join("/");
        throw new LabError("LAB_PATH_INVALID", `${relative}: Lab 必须放在 theory、exercise 或 project 分类目录中`);
      }
    }
    for (const category of LAB_CATEGORIES) {
      const categoryPath = path.join(chapterPath, category);
      let labEntries;
      try {
        labEntries = await readdir(categoryPath, { withFileTypes: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === "ENOENT") continue;
        throw error;
      }
      for (const labEntry of labEntries) {
        if (!labEntry.isDirectory()) continue;
        if (!LAB_DIRECTORY_PATTERN.test(labEntry.name)) {
          const relative = path.relative(root, path.join(categoryPath, labEntry.name)).split(path.sep).join("/");
          throw new LabError("LAB_PATH_INVALID", `${relative}: Lab 目录应为 X-CC-SS-kebab-slug`);
        }
        const labPath = path.join(categoryPath, labEntry.name);
        const readmePath = path.join(labPath, "README.md");
        let source: string;
        try {
          source = await readFile(readmePath, "utf8");
        } catch (error) {
          if ((error as NodeJS.ErrnoException)?.code === "ENOENT") continue;
          throw error;
        }
        const { data } = parseFrontmatter(source, path.relative(root, readmePath));
        const type = await readManifestType(labPath);
        const declaredCategory = type ? categoryForType(type) : (data["labCategory"] ?? "").trim();
        records.push({
          labPath,
          readmePath,
          relativePath: path.relative(root, labPath).split(path.sep).join("/"),
          directoryName: labEntry.name,
          directoryIdentity: parseLabDirectoryName(labEntry.name),
          pathChapter,
          categoryDirectory: category,
          type,
          category: declaredCategory || undefined,
          labId: (data["labId"] ?? "").trim(),
          order: Number(data["order"]),
        });
      }
    }
  }

  return records;
}

function validateRecordIdentity(record: LabRecord): ParsedLabId {
  if (!record.labId) throw new LabError("LAB_ID_MISSING", `${record.relativePath}/README.md: 缺少 labId`);
  const parsed = parseLabId(record.labId);
  if (parsed.id !== record.labId) {
    throw new LabError("LAB_ID_NOT_CANONICAL", `${record.relativePath}/README.md: labId 应写为 ${parsed.id}`);
  }
  if (parsed.chapter !== record.pathChapter) {
    throw new LabError("LAB_ID_CHAPTER_MISMATCH", `${record.relativePath}/README.md: labId 章节与目录不一致`);
  }
  if (record.directoryIdentity.id !== parsed.id) {
    throw new LabError(
      "LAB_ID_PATH_MISMATCH",
      `${record.relativePath}/README.md: 目录编号必须与 labId ${parsed.id} 一致`,
    );
  }
  const expectedTag = tagForCategory(record.category);
  if (!expectedTag) {
    throw new LabError(
      "LAB_CATEGORY_MISSING",
      `${record.relativePath}/README.md: 无法确定 Theory、Exercise 或 Project 分类`,
    );
  }
  if (parsed.tag !== expectedTag) {
    throw new LabError(
      "LAB_ID_TYPE_MISMATCH",
      `${record.relativePath}/README.md: ${record.labId} 与 ${record.category} 分类不一致，应使用 ${expectedTag}`,
    );
  }
  if (record.categoryDirectory !== record.category) {
    throw new LabError(
      "LAB_CATEGORY_PATH_MISMATCH",
      `${record.relativePath}/README.md: ${record.categoryDirectory} 目录与 ${record.category} 分类不一致`,
    );
  }

  return parsed;
}

export interface AllocatedIdentity {
  id: string;
  chapter: number;
  tag: LabTag;
  sequence: number;
  order: number;
}

export async function allocateLabIdentity(
  root: string,
  options: { chapter: unknown; type: unknown; order?: unknown },
): Promise<AllocatedIdentity> {
  const chapter = integer(options.chapter, "--chapter", 0);
  if (chapter > 99) throw new LabError("ARGUMENT_INVALID", "--chapter 必须是 0～99 的整数");
  const tag = tagForType(options.type);
  const records = await scanLabRecords(root, { chapter });
  const seen = new Set<string>();
  let maxSequence = 0;
  let maxOrder = 0;
  for (const record of records) {
    const parsed = validateRecordIdentity(record);
    if (seen.has(parsed.id)) throw new LabError("LAB_ID_DUPLICATE", `稳定 ID 重复：${parsed.id}`);
    seen.add(parsed.id);
    if (parsed.tag === tag) maxSequence = Math.max(maxSequence, parsed.sequence);
    if (Number.isInteger(record.order) && record.order >= 0) maxOrder = Math.max(maxOrder, record.order);
  }
  const order = options.order === undefined ? maxOrder + 1 : integer(options.order, "--order", 0);
  if (options.order !== undefined && records.some((record) => record.order === order)) {
    throw new LabError("ORDER_DUPLICATE", `第 ${chapter} 章已经使用展示顺序 ${order}`);
  }
  const sequence = maxSequence + 1;

  return { id: formatLabId(chapter, tag, sequence), chapter, tag, sequence, order };
}

export async function locateLabById(root: string, value: unknown): Promise<LabRecord & { id: string }> {
  const id = normalizeLabId(value);
  const matches = (await scanLabRecords(root)).filter(
    (record) => record.labId !== undefined && normalizeLabId(record.labId) === id,
  );
  if (matches.length === 0) throw new LabError("LAB_ID_NOT_FOUND", `没有找到 Lab：${id}`);
  if (matches.length > 1) {
    throw new LabError(
      "LAB_ID_DUPLICATE",
      `稳定 ID ${id} 对应多个目录：${matches.map((item) => item.relativePath).join("、")}`,
    );
  }

  return { id, ...matches[0]! };
}
