import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import mathjax3 from "markdown-it-mathjax3";
import { createHighlighter } from "shiki";
import { defineLoader } from "vitepress";

// github-dark 里数字 token 是蓝色 #79B8FF；渲染后统一替换为亮白，其余高亮不变。
const NUMBER_TOKEN_COLOR = /#79[Bb]8[Ff]{2}/g;
const NUMBER_TEXT_COLOR = "#d7dbe8";

export interface QuizQuestion {
  id: string;
  title?: string;
  source?: string;
  difficulty?: string;
  topics?: string[];
  targetId?: string;
  stem: string;
  /** 构建期渲染后的受信任本地 Markdown。 */
  stemHtml: string;
  code?: string;
  /** 构建期用 shiki 高亮后的代码 HTML，渲染在深色代码窗口内。 */
  codeHtml?: string;
  hint?: string;
  hintHtml?: string;
  options: string[];
  optionHtml: string[];
  answer: number;
  explanation: string;
  explanationHtml: string;
  points: number;
}

export declare const data: Record<string, QuizQuestion[]>;

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false }).use(mathjax3);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown, field: string, source: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${source}: ${field} 必须是非空字符串`);
  }
  return value;
}

function parseQuestion(value: unknown, index: number, source: string): Omit<QuizQuestion, "stemHtml" | "codeHtml" | "hintHtml" | "optionHtml" | "explanationHtml"> {
  const label = `${source}: 第 ${index + 1} 题`;
  if (!isRecord(value)) throw new Error(`${label} 必须是对象`);

  const id = optionalString(value.id, "id", label);
  const stem = optionalString(value.stem, "stem", label);
  const explanation = optionalString(value.explanation, "explanation", label);
  if (!id || !stem || !explanation) throw new Error(`${label} 缺少必填字段`);
  if (!Array.isArray(value.options) || value.options.length !== 4) {
    throw new Error(`${label} options 必须恰好包含 4 项`);
  }
  const options = value.options.map((option, optionIndex) => {
    if (typeof option !== "string" || !option.trim()) {
      throw new Error(`${label} 的选项 ${optionIndex + 1} 必须是非空字符串`);
    }
    if (/^[A-DＡ-Ｄ][.．、:：)）]\s*/i.test(option.trim())) {
      throw new Error(`${label} 的选项 ${optionIndex + 1} 不要手写 A、B、C、D 前缀`);
    }
    return option;
  });
  const normalizedOptions = options.map((option) => option.trim().replace(/\s+/gu, " ").toLocaleLowerCase());
  if (new Set(normalizedOptions).size !== normalizedOptions.length) throw new Error(`${label} 含重复选项`);
  if (!Number.isInteger(value.answer) || Number(value.answer) < 0 || Number(value.answer) >= options.length) {
    throw new Error(`${label} answer 必须是 0～3 的整数`);
  }
  if (value.topics !== undefined && (!Array.isArray(value.topics) || value.topics.some((topic) => typeof topic !== "string" || !topic.trim()))) {
    throw new Error(`${label} topics 必须是非空字符串数组`);
  }
  if (value.points !== undefined && (!Number.isInteger(value.points) || Number(value.points) <= 0)) {
    throw new Error(`${label} points 必须是正整数`);
  }

  return {
    id,
    title: optionalString(value.title, "title", label),
    source: optionalString(value.source, "source", label),
    difficulty: optionalString(value.difficulty, "difficulty", label),
    topics: value.topics as string[] | undefined,
    targetId: optionalString(value.targetId, "targetId", label),
    stem,
    code: optionalString(value.code, "code", label),
    hint: optionalString(value.hint, "hint", label),
    options,
    answer: Number(value.answer),
    explanation,
    points: value.points === undefined ? 1 : Number(value.points),
  };
}

function parseQuiz(value: unknown, source: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${source}: 顶层必须是非空题目数组`);
  }
  const questions = value.map((question, index) => parseQuestion(question, index, source));
  const ids = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`${source}: 题目标识 ${question.id} 重复`);
    ids.add(question.id);
  }
  return questions;
}

async function highlightCode(code: string): Promise<string> {
  highlighterPromise ??= createHighlighter({ themes: ["github-dark"], langs: ["c"] });
  const highlighter = await highlighterPromise;
  const html = highlighter.codeToHtml(code, { lang: "c", theme: "github-dark" });
  return html.replace(NUMBER_TOKEN_COLOR, NUMBER_TEXT_COLOR);
}

export default defineLoader({
  watch: ["labs/chapter-*/lab-*/quiz.json"],
  async load() {
    const byLab: Record<string, QuizQuestion[]> = {};
    const labsRoot = path.join(projectRoot, "labs");
    for (const chapter of readdirSync(labsRoot, { withFileTypes: true })) {
      if (!chapter.isDirectory() || !/^chapter-\d{2}$/.test(chapter.name)) continue;
      const chapterRoot = path.join(labsRoot, chapter.name);
      for (const lab of readdirSync(chapterRoot, { withFileTypes: true })) {
        if (!lab.isDirectory() || !/^lab-\d{2}-\d{2}-[a-z0-9-]+$/.test(lab.name)) continue;
        const quizPath = path.join(chapterRoot, lab.name, "quiz.json");
        // 没有 quiz.json 的 Lab 不是自测型，跳过；存在但损坏则立即让构建失败。
        if (!existsSync(quizPath)) continue;
        const parsed = JSON.parse(readFileSync(quizPath, "utf8")) as unknown;
        const raw = parseQuiz(parsed, quizPath);
        const questions = await Promise.all(
          raw.map(async (question) => ({
            ...question,
            stemHtml: markdown.render(question.stem),
            codeHtml: question.code ? await highlightCode(question.code) : undefined,
            hintHtml: question.hint ? markdown.render(question.hint) : undefined,
            optionHtml: question.options.map((option) => markdown.renderInline(option)),
            explanationHtml: markdown.render(question.explanation),
          })),
        );
        byLab[`labs/${chapter.name}/${lab.name}`] = questions;
      }
    }
    return byLab;
  },
});
