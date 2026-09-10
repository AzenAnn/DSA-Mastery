import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  LAB_CATEGORIES,
  LEGACY_LAB_DIRECTORY_PATTERN,
  categoryForType,
  formatLabDirectoryName,
  formatLabDocumentTitlePrefix,
  parseLabId,
  scanLabRecords,
  tagForCategory,
} from "../tools/lab/identity.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const labsRoot = path.join(projectRoot, "labs");
const mappingFile = path.join(
  projectRoot,
  ".trellis",
  "tasks",
  "09-01-lab-category-directory-migration",
  "research",
  "lab-path-mapping.json",
);
const writeMode = process.argv.includes("--write");
const expectedCounts = Object.freeze({ total: 173, theory: 43, exercise: 122, project: 8 });
const globalRewriteRoots = [
  ".github",
  ".trellis/spec",
  ".vitepress",
  "content",
  "docs",
  "labs",
  "scripts",
  "tests",
  "tools",
];
const globalRewriteFiles = ["CONTRIBUTING.md", "Makefile", "README.md", "package.json"];

function posix(value) {
  return value.split(path.sep).join("/");
}

function isWithin(target, parent) {
  const relative = path.relative(parent, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function assertWithin(target, parent, label) {
  if (!isWithin(path.resolve(target), path.resolve(parent))) {
    throw new Error(`${label} 越出允许范围：${target}`);
  }
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function readManifestType(labPath) {
  const manifestPath = path.join(labPath, "lab.json");
  if (!(await exists(manifestPath))) return undefined;
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!categoryForType(manifest.type)) {
    throw new Error(`${posix(path.relative(projectRoot, manifestPath))}: type 必须是 quiz、program 或 project`);
  }
  return manifest.type;
}

async function collectLegacyRecords() {
  const records = [];
  for (const chapterEntry of await readdir(labsRoot, { withFileTypes: true })) {
    const chapterMatch = chapterEntry.isDirectory() && chapterEntry.name.match(/^chapter-(\d{2})$/);
    if (!chapterMatch) continue;
    const chapter = Number(chapterMatch[1]);
    const chapterPath = path.join(labsRoot, chapterEntry.name);
    for (const labEntry of await readdir(chapterPath, { withFileTypes: true })) {
      if (!labEntry.isDirectory()) continue;
      const legacyMatch = labEntry.name.match(LEGACY_LAB_DIRECTORY_PATTERN);
      if (!legacyMatch) {
        if (!LAB_CATEGORIES.includes(labEntry.name)) {
          throw new Error(`${posix(path.relative(projectRoot, path.join(chapterPath, labEntry.name)))}: 含无法识别的章节子目录`);
        }
        continue;
      }
      const oldPath = path.join(chapterPath, labEntry.name);
      const readmePath = path.join(oldPath, "README.md");
      const parsed = matter(await readFile(readmePath, "utf8"));
      const identity = parseLabId(parsed.data.labId);
      const type = await readManifestType(oldPath);
      const category = type ? categoryForType(type) : String(parsed.data.labCategory ?? "").trim();
      if (!LAB_CATEGORIES.includes(category)) {
        throw new Error(`${posix(path.relative(projectRoot, readmePath))}: 无法确定 Theory、Exercise 或 Project 分类`);
      }
      if (identity.chapter !== chapter || identity.tag !== tagForCategory(category)) {
        throw new Error(`${posix(path.relative(projectRoot, readmePath))}: labId 与章节或分类不一致`);
      }
      if (Number(legacyMatch[1]) !== chapter || Number(legacyMatch[2]) !== Number(parsed.data.order)) {
        throw new Error(`${posix(path.relative(projectRoot, readmePath))}: 旧目录编号与 chapter/order 不一致`);
      }
      const slug = legacyMatch[3];
      const directoryName = formatLabDirectoryName(identity.id, slug);
      const newPath = path.join(chapterPath, category, directoryName);
      records.push({
        id: identity.id,
        chapter,
        category,
        slug,
        title: String(parsed.data.title ?? ""),
        oldPath,
        newPath,
        oldRelative: posix(path.relative(projectRoot, oldPath)),
        newRelative: posix(path.relative(projectRoot, newPath)),
      });
    }
  }
  return records.sort((left, right) => left.id.localeCompare(right.id));
}

function assertMapping(records) {
  if (records.length !== expectedCounts.total) {
    throw new Error(`迁移基线必须包含 ${expectedCounts.total} 个 Lab，实际 ${records.length}`);
  }
  const ids = new Set();
  const sources = new Set();
  const targets = new Set();
  const counts = { theory: 0, exercise: 0, project: 0 };
  for (const record of records) {
    assertWithin(record.oldPath, path.join(labsRoot, `chapter-${String(record.chapter).padStart(2, "0")}`), "源路径");
    assertWithin(record.newPath, path.join(labsRoot, `chapter-${String(record.chapter).padStart(2, "0")}`, record.category), "目标路径");
    if (ids.has(record.id)) throw new Error(`重复 labId：${record.id}`);
    if (sources.has(record.oldRelative)) throw new Error(`重复源路径：${record.oldRelative}`);
    if (targets.has(record.newRelative)) throw new Error(`重复目标路径：${record.newRelative}`);
    ids.add(record.id);
    sources.add(record.oldRelative);
    targets.add(record.newRelative);
    counts[record.category] += 1;
  }
  for (const category of LAB_CATEGORIES) {
    if (counts[category] !== expectedCounts[category]) {
      throw new Error(`${category} 基线应为 ${expectedCounts[category]}，实际 ${counts[category]}`);
    }
  }
  return counts;
}

function relocatedTarget(target, records) {
  for (const record of records) {
    if (!isWithin(target, record.oldPath)) continue;
    return path.join(record.newPath, path.relative(record.oldPath, target));
  }
  return target;
}

function rewriteMarkdownLinks(source, oldFile, newFile, records) {
  return source.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (full, opening, rawHref, closing) => {
    const href = rawHref.trim();
    if (!href || href.startsWith("#") || href.startsWith("/") || /^[a-z][a-z\d+.-]*:/i.test(href)) return full;
    if (/\s+["']/.test(href)) return full;
    const hashIndex = href.indexOf("#");
    const queryIndex = href.indexOf("?");
    const splitIndexes = [hashIndex, queryIndex].filter((index) => index >= 0);
    const suffixIndex = splitIndexes.length ? Math.min(...splitIndexes) : href.length;
    const pathPart = href.slice(0, suffixIndex);
    const suffix = href.slice(suffixIndex);
    if (!pathPart) return full;
    let decoded;
    try {
      decoded = decodeURIComponent(pathPart);
    } catch {
      return full;
    }
    const oldTarget = path.resolve(path.dirname(oldFile), decoded);
    const newTarget = relocatedTarget(oldTarget, records);
    let relative = posix(path.relative(path.dirname(newFile), newTarget));
    if (!relative) relative = path.basename(newTarget);
    if (pathPart.startsWith("./") && !relative.startsWith(".")) relative = `./${relative}`;
    if (pathPart.endsWith("/") && !relative.endsWith("/")) relative += "/";
    return `${opening}${encodeURI(relative).replaceAll("#", "%23")}${suffix}${closing}`;
  });
}

function rewriteSchemaPaths(source, oldFile, newFile) {
  return source.replace(/("\$schema"\s*:\s*")([^"]+)(")/g, (full, opening, schemaPath, closing) => {
    if (path.isAbsolute(schemaPath) || /^[a-z][a-z\d+.-]*:/i.test(schemaPath)) return full;
    const target = path.resolve(path.dirname(oldFile), schemaPath);
    const relative = posix(path.relative(path.dirname(newFile), target));
    return `${opening}${relative}${closing}`;
  });
}

function stableTitle(oldTitle, id) {
  const titleName = String(oldTitle).replace(/^Lab\s+\d{2}-(?:[TEP]-)?\d{2,}：\s*/u, "").trim();
  if (!titleName) throw new Error(`${id}: 无法从旧标题提取题目名称`);
  return `${formatLabDocumentTitlePrefix(id)}${titleName}`;
}

async function collectFiles(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.name === ".lab-cache") continue;
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(target)));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

async function prepareLabRewrites(records) {
  const rewrites = [];
  for (const record of records) {
    for (const oldFile of await collectFiles(record.oldPath)) {
      const buffer = await readFile(oldFile);
      if (buffer.includes(0)) continue;
      const newFile = path.join(record.newPath, path.relative(record.oldPath, oldFile));
      let source = buffer.toString("utf8");
      let updated = source;
      const extension = path.extname(oldFile).toLowerCase();
      if (extension === ".md" || extension === ".json") {
        updated = rewriteMarkdownLinks(updated, oldFile, newFile, records);
      }
      if (path.basename(oldFile).toLowerCase() === "readme.md") {
        const title = stableTitle(record.title, record.id);
        updated = updated.replace(/^title:\s*.*$/m, `title: ${JSON.stringify(title)}`);
        updated = updated.replace(/^#\s+.*$/m, `# ${title}`);
      }
      if (extension === ".json") {
        updated = rewriteSchemaPaths(updated, oldFile, newFile);
      }
      if (path.basename(oldFile) === "Makefile") {
        updated = updated
          .replace("REPO_ROOT := $(LAB_DIR)/../../..", "REPO_ROOT := $(LAB_DIR)/../../../..")
          .replace("include ../../../tools/lab/lab.mk", "include ../../../../tools/lab/lab.mk");
      }
      if (updated !== source) rewrites.push({ file: newFile, content: updated });
    }
  }
  return rewrites;
}

async function collectGlobalTextFiles() {
  const files = [];
  for (const relativeRoot of globalRewriteRoots) {
    const root = path.join(projectRoot, relativeRoot);
    if (await exists(root)) files.push(...(await collectFiles(root)));
  }
  for (const relativeFile of globalRewriteFiles) {
    const file = path.join(projectRoot, relativeFile);
    if (await exists(file)) files.push(file);
  }
  return [...new Set(files.map((file) => path.resolve(file)))];
}

async function rewriteGlobalPaths(records) {
  let changed = 0;
  for (const file of await collectGlobalTextFiles()) {
    const buffer = await readFile(file);
    if (buffer.includes(0)) continue;
    const source = buffer.toString("utf8");
    let updated = source;
    for (const record of records) {
      updated = updated
        .split(record.oldRelative)
        .join(record.newRelative)
        .split(record.oldRelative.replaceAll("/", "\\"))
        .join(record.newRelative.replaceAll("/", "\\"));
    }
    if (updated === source) continue;
    await writeFile(file, updated, "utf8");
    changed += 1;
  }
  return changed;
}

async function writeEmptyCategoryMarkers() {
  let empty = 0;
  for (const chapterEntry of await readdir(labsRoot, { withFileTypes: true })) {
    if (!chapterEntry.isDirectory() || !/^chapter-\d{2}$/.test(chapterEntry.name)) continue;
    for (const category of LAB_CATEGORIES) {
      const categoryPath = path.join(labsRoot, chapterEntry.name, category);
      await mkdir(categoryPath, { recursive: true });
      const entries = await readdir(categoryPath, { withFileTypes: true });
      if (entries.some((entry) => entry.isDirectory())) continue;
      await writeFile(path.join(categoryPath, ".gitkeep"), "", { flag: "wx" });
      empty += 1;
    }
  }
  if (empty !== 9) throw new Error(`空分类目录应为 9 个，实际 ${empty}`);
}

async function verifyMigratedLayout() {
  const records = await scanLabRecords(projectRoot);
  const counts = { theory: 0, exercise: 0, project: 0 };
  for (const record of records) counts[record.categoryDirectory] += 1;
  if (records.length !== expectedCounts.total) {
    throw new Error(`迁移后应发现 ${expectedCounts.total} 个 Lab，实际 ${records.length}`);
  }
  for (const category of LAB_CATEGORIES) {
    if (counts[category] !== expectedCounts[category]) {
      throw new Error(`迁移后 ${category} 应为 ${expectedCounts[category]}，实际 ${counts[category]}`);
    }
  }
  return counts;
}

const records = await collectLegacyRecords();
const counts = assertMapping(records);
for (const record of records) {
  if (await exists(record.newPath)) throw new Error(`目标路径已存在：${record.newRelative}`);
}

if (!writeMode) {
  console.log(JSON.stringify({ mode: "dry-run", counts, entries: records.map(({ id, category, oldRelative, newRelative }) => ({ id, category, oldPath: oldRelative, newPath: newRelative })) }, null, 2));
  process.exit(0);
}

const labRewrites = await prepareLabRewrites(records);
for (const record of records) await mkdir(path.dirname(record.newPath), { recursive: true });
for (const record of records) await rename(record.oldPath, record.newPath);
for (const rewrite of labRewrites) await writeFile(rewrite.file, rewrite.content, "utf8");
const changedGlobalFiles = await rewriteGlobalPaths(records);
await writeEmptyCategoryMarkers();
await mkdir(path.dirname(mappingFile), { recursive: true });
await writeFile(
  mappingFile,
  `${JSON.stringify({ schemaVersion: 1, counts, entries: records.map(({ id, category, oldRelative, newRelative }) => ({ id, category, oldPath: oldRelative, newPath: newRelative })) }, null, 2)}\n`,
  { encoding: "utf8", flag: "wx" },
);
const migratedCounts = await verifyMigratedLayout();
console.log(`迁移完成：${records.length} 个 Lab，Theory ${migratedCounts.theory}，Exercise ${migratedCounts.exercise}，Project ${migratedCounts.project}；更新 ${changedGlobalFiles} 个全仓引用文件。`);
