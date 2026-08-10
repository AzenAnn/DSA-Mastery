import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHighlighter } from "shiki";
import { defineLoader } from "vitepress";

// github-dark 里数字 token 是蓝色 #79B8FF；渲染后统一替换为亮白，其余高亮不变。
const NUMBER_TOKEN_COLOR = /#79[Bb]8[Ff]{2}/g;
const NUMBER_TEXT_COLOR = "#d7dbe8";

export interface QuizQuestion {
  id: string;
  stem: string;
  code?: string;
  /** 构建期用 shiki 高亮后的代码 HTML，渲染在深色代码窗口内。 */
  codeHtml?: string;
  options: string[];
  answer: number;
  explanation: string;
}

export declare const data: Record<string, QuizQuestion[]>;

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

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
        try {
          const parsed = JSON.parse(readFileSync(quizPath, "utf8")) as unknown;
          if (!Array.isArray(parsed)) throw new Error("quiz.json 顶层必须是题目数组");
          const raw = parsed as QuizQuestion[];
          const questions = await Promise.all(
            raw.map(async (question) => ({
              ...question,
              codeHtml: question.code ? await highlightCode(question.code) : undefined,
            })),
          );
          byLab[`labs/${chapter.name}/${lab.name}`] = questions;
        } catch (error) {
          if (error instanceof Error && error.message === "quiz.json 顶层必须是题目数组") {
            throw new Error(`${quizPath}: ${error.message}`);
          }
          // 没有 quiz.json 的 Lab 不是自测型，跳过。
        }
      }
    }
    return byLab;
  },
});
