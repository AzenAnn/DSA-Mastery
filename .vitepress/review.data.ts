import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import mathjax3 from "markdown-it-mathjax3";
import { defineLoader } from "vitepress";
import type { QuizQuestion } from "./quiz.data";

export declare const data: Record<string, QuizQuestion[]>;

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false }).use(mathjax3);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}: ${field} 必须是非空字符串`);
  }
  return value;
}

function parseReview(
  value: unknown,
  source: string,
): Array<Omit<QuizQuestion, "stemHtml" | "codeHtml" | "optionHtml" | "explanationHtml">> {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${source}: 顶层必须是非空题目数组`);
  }
  const ids = new Set<string>();
  return value.map((item, index) => {
    const label = `${source}: 第 ${index + 1} 题`;
    if (!isRecord(item)) throw new Error(`${label} 必须是对象`);

    const id = requiredString(item.id, "id", label);
    if (ids.has(id)) throw new Error(`${source}: 题目标识 ${id} 重复`);
    ids.add(id);

    const stem = requiredString(item.stem, "stem", label);
    const explanation = requiredString(item.explanation, "explanation", label);
    if (!Array.isArray(item.options) || item.options.length !== 4) {
      throw new Error(`${label} options 必须恰好包含 4 项`);
    }
    const options = item.options.map((option, optionIndex) => {
      if (typeof option !== "string" || !option.trim()) {
        throw new Error(`${label} 的选项 ${optionIndex + 1} 必须是非空字符串`);
      }
      return option;
    });
    if (!Number.isInteger(item.answer) || Number(item.answer) < 0 || Number(item.answer) >= options.length) {
      throw new Error(`${label} answer 必须是 0～3 的整数`);
    }

    let optionTargets: string[] | undefined;
    if (item.optionTargets !== undefined) {
      if (!Array.isArray(item.optionTargets) || item.optionTargets.length !== options.length) {
        throw new Error(`${label} optionTargets 必须与 options 等长`);
      }
      optionTargets = item.optionTargets.map((target, optionIndex) => {
        if (typeof target !== "string" || !target.trim()) {
          throw new Error(`${label} 选项 ${optionIndex + 1} 的 optionTargets 必须是非空字符串`);
        }
        return target;
      });
    }

    const block = item.block === undefined ? undefined : requiredString(item.block, "block", label);

    return {
      id,
      block,
      stem,
      options,
      answer: Number(item.answer),
      explanation,
      points: 1,
      optionTargets,
    };
  });
}

export default defineLoader({
  watch: ["content/chapter-*/**/*.review.json"],
  async load() {
    const byLesson: Record<string, QuizQuestion[]> = {};
    const contentRoot = path.join(projectRoot, "content");
    for (const chapter of readdirSync(contentRoot, { withFileTypes: true })) {
      if (!chapter.isDirectory() || !/^chapter-\d{2}-[a-z0-9-]+$/.test(chapter.name)) continue;
      const chapterRoot = path.join(contentRoot, chapter.name);
      for (const file of readdirSync(chapterRoot, { withFileTypes: true })) {
        if (!file.isFile() || !file.name.endsWith(".review.json")) continue;

        const reviewPath = path.join(chapterRoot, file.name);
        const parsed = JSON.parse(readFileSync(reviewPath, "utf8")) as unknown;
        const raw = parseReview(parsed, reviewPath);
        const questions = await Promise.all(
          raw.map(async (question) => ({
            ...question,
            stemHtml: markdown.render(question.stem),
            optionHtml: question.options.map((option) => markdown.renderInline(option)),
            explanationHtml: markdown.render(question.explanation),
          })),
        );
        byLesson[`content/${chapter.name}/${file.name.replace(/\.review\.json$/, "")}`] = questions;
      }
    }
    return byLesson;
  },
});
