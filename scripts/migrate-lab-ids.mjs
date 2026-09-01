import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  formatLabId,
  insertLabIdFrontmatter,
  parseLabId,
  scanLabRecords,
  tagForCategory,
} from "../tools/lab/identity.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const write = process.argv.includes("--write");
const records = await scanLabRecords(projectRoot);
const groups = new Map();
const seenIds = new Map();

for (const record of records) {
  const tag = tagForCategory(record.category);
  if (!tag) throw new Error(`${record.relativePath}/README.md: 迁移前必须明确 labCategory 或提供有效 lab.json.type`);
  const key = `${record.pathChapter}:${tag}`;
  const group = groups.get(key) ?? [];
  group.push({ ...record, tag });
  groups.set(key, group);
}

const changes = [];
for (const group of groups.values()) {
  group.sort((left, right) => left.order - right.order || left.relativePath.localeCompare(right.relativePath));
  let maxSequence = 0;
  for (const record of group) {
    if (!record.labId) continue;
    const parsed = parseLabId(record.labId);
    if (parsed.id !== record.labId) throw new Error(`${record.relativePath}/README.md: labId 应规范为 ${parsed.id}`);
    if (parsed.chapter !== record.pathChapter || parsed.tag !== record.tag) {
      throw new Error(`${record.relativePath}/README.md: labId ${record.labId} 与章节或类型不一致`);
    }
    const duplicate = seenIds.get(parsed.id);
    if (duplicate) throw new Error(`labId ${parsed.id} 重复：${duplicate}、${record.relativePath}`);
    seenIds.set(parsed.id, record.relativePath);
    maxSequence = Math.max(maxSequence, parsed.sequence);
  }

  for (const record of group) {
    if (record.labId) continue;
    maxSequence += 1;
    const labId = formatLabId(record.pathChapter, record.tag, maxSequence);
    if (seenIds.has(labId)) throw new Error(`迁移生成重复 labId：${labId}`);
    seenIds.set(labId, record.relativePath);
    changes.push({ ...record, labId });
  }
}

for (const change of changes) {
  const source = await readFile(change.readmePath, "utf8");
  const updated = insertLabIdFrontmatter(source, change.labId);
  if (write) await writeFile(change.readmePath, updated, "utf8");
  console.log(`${write ? "UPDATED" : "WOULD UPDATE"} ${change.labId}  ${change.relativePath}`);
}

console.log(`${write ? "迁移完成" : "迁移预览"}：${records.length} 个 Lab，${changes.length} 个待写入，${seenIds.size} 个稳定 ID。`);
