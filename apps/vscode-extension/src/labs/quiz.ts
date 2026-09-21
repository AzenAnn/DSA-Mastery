import type { QuizQuestion } from "@dsa/lab-core";

export interface QuizScore {
  score: number;
  maxScore: number;
  correctCount: number;
  answeredCount: number;
  completed: boolean;
}

export function scoreQuiz(questions: QuizQuestion[], selections: Record<string, number | null | undefined>): QuizScore {
  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let answeredCount = 0;
  for (const question of questions) {
    maxScore += question.points;
    const selected = selections[question.id];
    if (selected === null || selected === undefined) continue;
    answeredCount += 1;
    if (selected === question.answer) {
      correctCount += 1;
      score += question.points;
    }
  }
  return {
    score,
    maxScore,
    correctCount,
    answeredCount,
    completed: questions.length > 0 && correctCount === questions.length,
  };
}

/**
 * 树视图要展示的三种状态。`passed` 一旦拿到就不再回退,与代码题一致。
 * 「答过但没全对」独立成一档,是因为它需要跟「没动过」在视觉上分开,
 * 但两者都还不是完成态 —— 调用方应保持同一种形状、只换颜色。
 */
export type QuizIconState = "untouched" | "in-progress" | "passed";

export function quizIconState(passed: boolean, answeredCount: number): QuizIconState {
  if (passed) return "passed";
  return answeredCount > 0 ? "in-progress" : "untouched";
}
