import { LabError } from "../errors.ts";
import { normalizeLabId } from "./lab-id.ts";

export interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

const BLOCK = /^---[^\S\r\n]*\r?\n([\s\S]*?)\r?\n---\s*/;

/**
 * 课程 frontmatter 只用扁平的 `key: value`，所以这里不引入 YAML 解析器 —— 判题内核要保持零第三方依赖。
 * 需要数组或嵌套值的站点索引另行使用 gray-matter。
 */
export function parseFrontmatter(source: string, label = "README.md"): Frontmatter {
  const match = source.match(BLOCK);
  if (!match) throw new LabError("FRONTMATTER_INVALID", `${label}: 缺少 YAML frontmatter`);
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    data[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  }

  return { data, body: source.slice(match[0].length) };
}

export function insertLabIdFrontmatter(source: string, value: unknown): string {
  const labId = normalizeLabId(value);
  let foundChapter = false;
  const updated = source.replace(/^(chapter:[^\r\n]+)(\r?\n)/m, (_match, chapterLine: string, newline: string) => {
    foundChapter = true;

    return `${chapterLine}${newline}labId: "${labId}"${newline}`;
  });
  if (!foundChapter) {
    throw new LabError("FRONTMATTER_INVALID", "README frontmatter 中缺少 chapter，无法插入 labId");
  }

  return updated;
}
