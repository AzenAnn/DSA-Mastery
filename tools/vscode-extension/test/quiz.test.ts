import test from "node:test";
import assert from "node:assert/strict";
import { parseQuizQuestions, quizIconState, scoreQuiz, type QuizQuestion } from "../src/quiz.ts";

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

test("parses the existing four-option quiz format", () => {
  assert.deepEqual(
    parseQuizQuestions(questions).map(({ id, stem, options, answer, explanation, points }) => ({
      id,
      stem,
      options,
      answer,
      explanation,
      points,
    })),
    questions,
  );
});

test("scores selected answers and reports completion only when every question is correct", () => {
  assert.deepEqual(scoreQuiz(questions, { q1: 1, q2: 0 }), {
    score: 2,
    maxScore: 3,
    correctCount: 1,
    answeredCount: 2,
    completed: false,
  });
  assert.deepEqual(scoreQuiz(questions, { q1: 1, q2: 3 }), {
    score: 3,
    maxScore: 3,
    correctCount: 2,
    answeredCount: 2,
    completed: true,
  });
});

test("rejects malformed quiz questions before they reach the webview", () => {
  assert.throws(
    () =>
      parseQuizQuestions([
        { ...questions[0], options: ["A", "B", "C"] },
      ]),
    /options 必须恰好包含 4 项/,
  );
});

test("keeps a quiz distinguishable from a program lab until it is passed", () => {
  // 未完成的两档必须是同一档之外的两个不同状态:树视图靠它们决定
  // 「保持问号、只换颜色」,一旦把 in-progress 和 untouched 合并或
  // 把 in-progress 当成完成态,问号就会消失、跟代码题中间态撞脸。
  assert.equal(quizIconState(false, 0), "untouched");
  assert.equal(quizIconState(false, 1), "in-progress");
  assert.equal(quizIconState(false, 4), "in-progress");
  assert.equal(quizIconState(true, 4), "passed");
  // 绿勾不回退:即使进度记录里答题数被清掉,passed 仍然优先。
  assert.equal(quizIconState(true, 0), "passed");
});
