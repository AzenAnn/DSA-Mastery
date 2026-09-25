import type { QuizQuestion } from "@dsa/lab-core";
import { expect, it } from "vitest";
import { quizIconState, scoreQuiz } from "../src/labs/quiz.ts";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    stem: "第一题",
    options: ["A", "B", "C", "D"],
    answer: 1,
    explanation: "因为 B。",
    points: 2,
  },
  {
    id: "q2",
    stem: "第二题",
    options: ["A", "B", "C", "D"],
    answer: 3,
    explanation: "因为 D。",
    points: 1,
  },
];

it("scores selected answers and reports completion only when every question is correct", () => {
  expect(scoreQuiz(questions, { q1: 1, q2: 0 })).toStrictEqual({
    score: 2,
    maxScore: 3,
    correctCount: 1,
    answeredCount: 2,
    completed: false,
  });
  expect(scoreQuiz(questions, { q1: 1, q2: 3 })).toStrictEqual({
    score: 3,
    maxScore: 3,
    correctCount: 2,
    answeredCount: 2,
    completed: true,
  });
});

it("keeps a quiz distinguishable from a program lab until it is passed", () => {
  // 未完成的两档必须是同一档之外的两个不同状态:树视图靠它们决定
  // 「保持问号、只换颜色」,一旦把 in-progress 和 untouched 合并或
  // 把 in-progress 当成完成态,问号就会消失、跟代码题中间态撞脸。
  expect(quizIconState(false, 0)).toBe("untouched");
  expect(quizIconState(false, 1)).toBe("in-progress");
  expect(quizIconState(false, 4)).toBe("in-progress");
  expect(quizIconState(true, 4)).toBe("passed");
  // 绿勾不回退:即使进度记录里答题数被清掉,passed 仍然优先。
  expect(quizIconState(true, 0)).toBe("passed");
});
