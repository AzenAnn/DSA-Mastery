import test from "node:test";
import assert from "node:assert/strict";
import { parseQuizQuestions, scoreQuiz, type QuizQuestion } from "../src/quiz.ts";

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
