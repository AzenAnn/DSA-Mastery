import { LabError } from "../errors.ts";

export type LabTag = "T" | "E" | "P";

export interface ParsedLabId {
  id: string;
  chapter: number;
  tag: LabTag;
  sequence: number;
}

function padMinimum(value: number | string, width = 2): string {
  return String(value).padStart(width, "0");
}

export function integer(value: unknown, label: string, minimum = 0): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new LabError("ARGUMENT_INVALID", `${label} 必须是大于等于 ${minimum} 的整数`);
  }

  return parsed;
}

export function formatLabId(chapter: unknown, tag: unknown, sequence: unknown): string {
  const normalizedChapter = integer(chapter, "章节", 0);
  const normalizedSequence = integer(sequence, "Lab 类型内序号", 1);
  const normalizedTag = String(tag ?? "").toUpperCase();
  if (!new Set(["T", "E", "P"]).has(normalizedTag)) {
    throw new LabError("LAB_ID_INVALID", "Lab 类型标签必须是 T、E 或 P");
  }
  if (normalizedChapter > 99) throw new LabError("LAB_ID_INVALID", "Lab 章节必须在 0～99 之间");

  return `${padMinimum(normalizedChapter)}${normalizedTag}${padMinimum(normalizedSequence)}`;
}

export function parseLabId(value: unknown): ParsedLabId {
  const source = String(value ?? "").trim();
  const match = source.match(/^(?:lab-?)?(\d{1,2})-?([tep])-?(\d+)$/i);
  if (!match) {
    throw new LabError("LAB_ID_INVALID", `Lab ID 格式无效：${source || "(empty)"}；示例：02T03、02T3、02-T-03`);
  }
  const chapter = Number(match[1]);
  const tag = match[2]!.toUpperCase() as LabTag;
  const sequence = Number(match[3]);
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new LabError("LAB_ID_INVALID", "Lab 类型内序号必须从 1 开始");
  }

  return { id: formatLabId(chapter, tag, sequence), chapter, tag, sequence };
}

export function normalizeLabId(value: unknown): string {
  return parseLabId(value).id;
}

export function formatLabDocumentTitlePrefix(value: unknown): string {
  const { chapter, tag, sequence } = parseLabId(value);

  return `Lab ${padMinimum(chapter)}-${tag}-${padMinimum(sequence)}：`;
}
