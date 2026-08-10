import { reactive } from "vue";

export type QuizItemStatus = "pending" | "correct" | "wrong";

/**
 * 每个 Lab 每道题的作答状态，key 为 lab 目录相对路径（与 quiz.data 的 key 一致）。
 * QuizSet 在提交/重新作答时更新，右侧 QuizNavigator 读取并渲染。
 */
export const quizStatus = reactive<Record<string, QuizItemStatus[]>>({});
