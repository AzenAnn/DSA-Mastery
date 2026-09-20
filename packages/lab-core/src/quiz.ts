import { LabError } from "./errors.ts";
import { assertKnownKeys, requirePositiveInteger, requireRecord, requireString, requireStringArray } from "./schema.ts";

export interface QuizQuestion {
  id: string;
  title?: string;
  source?: string;
  difficulty?: string;
  topics?: string[];
  targetId?: string;
  stem: string;
  code?: string;
  hint?: string;
  options: string[];
  answer: number;
  explanation: string;
  points: number;
  /** 教材正文即时复习：每个选项对应的原文锚点 id。 */
  optionTargets?: string[];
  /** 教材正文即时复习：所属复习块 id，配合 <QuizSet block="..."> 分组挂载。 */
  block?: string;
}

const QUESTION_KEYS = new Set([
  "id",
  "title",
  "source",
  "difficulty",
  "topics",
  "targetId",
  "stem",
  "code",
  "options",
  "answer",
  "explanation",
  "hint",
  "points",
  "optionTargets",
  "block",
]);

const OPTIONAL_STRING_KEYS = ["title", "source", "difficulty", "targetId", "code", "hint", "block"] as const;

const OPTION_PREFIX = /^[A-DＡＢＣＤ][.．、:：)）]\s*/i;

/** 题库是从个人笔记导出整理的，这些串是导出残留，不该出现在课程站点上。 */
const LEAKED_EXPORT_PHRASES = ["查看原始页面", "看交互可视化", "答案来源说明", "Codex 基于题面独立推理补全"];

function optionalString(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : requireString(value, label);
}

function parseQuestion(value: unknown, index: number, label: string): QuizQuestion {
  const itemLabel = `${label}: 第 ${index + 1} 题`;
  const raw = requireRecord(value, itemLabel);
  assertKnownKeys(raw, QUESTION_KEYS, itemLabel);

  if (!Array.isArray(raw.options) || raw.options.length !== 4) {
    throw new LabError("QUIZ_INVALID", `${itemLabel}.options 必须恰好包含 4 项`);
  }
  const options = raw.options.map((option, optionIndex) => {
    const text = requireString(option, `${itemLabel}.options[${optionIndex}]`);
    if (OPTION_PREFIX.test(text.trim())) {
      throw new LabError("QUIZ_INVALID", `${itemLabel}.options[${optionIndex}] 不要手写 A、B、C、D 前缀`);
    }

    return text;
  });
  const normalized = options.map((option) => option.trim().replace(/\s+/gu, " ").toLocaleLowerCase());
  if (new Set(normalized).size !== normalized.length) throw new LabError("QUIZ_INVALID", `${itemLabel} 含重复选项`);

  if (!Number.isInteger(raw.answer) || (raw.answer as number) < 0 || (raw.answer as number) > 3) {
    throw new LabError("QUIZ_INVALID", `${itemLabel}.answer 必须是 0～3 的整数`);
  }

  const question: QuizQuestion = {
    id: requireString(raw.id, `${itemLabel}.id`),
    stem: requireString(raw.stem, `${itemLabel}.stem`),
    explanation: requireString(raw.explanation, `${itemLabel}.explanation`),
    options,
    answer: raw.answer as number,
    points: raw.points === undefined ? 1 : requirePositiveInteger(raw.points, `${itemLabel}.points`),
  };
  for (const key of OPTIONAL_STRING_KEYS) {
    const text = optionalString(raw[key], `${itemLabel}.${key}`);
    if (text !== undefined) question[key] = text;
  }
  if (raw.topics !== undefined) question.topics = requireStringArray(raw.topics, `${itemLabel}.topics`, "QUIZ_INVALID");
  if (raw.optionTargets !== undefined) {
    question.optionTargets = requireStringArray(raw.optionTargets, `${itemLabel}.optionTargets`, "QUIZ_INVALID");
  }

  return question;
}

export function parseQuizQuestions(value: unknown, label = "quiz.json"): QuizQuestion[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new LabError("QUIZ_INVALID", `${label} 顶层必须是非空题目数组`);
  }
  const questions = value.map((question, index) => parseQuestion(question, index, label));
  const ids = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) throw new LabError("QUIZ_INVALID", `${label}: id ${question.id} 重复`);
    ids.add(question.id);
  }

  return questions;
}

export function assertNoLeakedExportPhrases(source: string, label: string): void {
  for (const phrase of LEAKED_EXPORT_PHRASES) {
    if (source.includes(phrase)) throw new LabError("QUIZ_INVALID", `${label} 含课程站点禁用的个人导出内容“${phrase}”`);
  }
}

export function countQuizMounts(source: string): number {
  return [...source.matchAll(/<QuizSet\s*\/>/g)].length;
}

const STATIC_ANSWER_PATTERNS = [
  /^### 题 \d+/m,
  /^::: details 查看答案与解析/m,
  /答案速查|展开答案表/,
  /^#{2,6}\s*(?:参考|标准|正确)?答案(?:与解析|总览|速查|表)?\s*$/m,
  /^\|[^\n|]*(?:题号|题目)[^\n]*\|[^\n|]*(?:答案|正确选项)[^\n]*\|/m,
  /^(?:\*\*)?(?:正确|标准|参考)?答案(?:\*\*)?[：:]\s*[A-DＡＢＣＤ](?:\b|[.．、)）])/im,
];

export function validateQuizReadme(source: unknown, label = "README.md"): { mountCount: number } {
  if (typeof source !== "string") throw new LabError("QUIZ_INVALID", `${label} 必须是文本文件`);
  const mountCount = countQuizMounts(source);
  if (mountCount !== 1) throw new LabError("QUIZ_INVALID", `${label} 必须且只能挂载一次 <QuizSet />`);
  if (STATIC_ANSWER_PATTERNS.some((pattern) => pattern.test(source))) {
    throw new LabError("QUIZ_INVALID", `${label} 不得重复维护静态题目或折叠答案`);
  }

  return { mountCount };
}
