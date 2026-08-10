<script setup lang="ts">
import { CheckCircle2, CircleAlert, Info, RotateCcw } from "@lucide/vue";
import { useData } from "vitepress";
import { computed, ref } from "vue";
import { data as quizIndex, type QuizQuestion } from "../../quiz.data";
import { quizStatus } from "../quiz-state";

const optionLabel = (index: number) => String.fromCharCode(65 + index);

const { page } = useData();

// 题目数据来自 data loader 扫描的 quiz.json，组件只负责渲染，不内置题目。
// 注意：rewrites 会把 README.md 重写为 index.md，两种文件名都要能匹配。
const labDir = computed(() => {
  const relativePath = page.value.relativePath.replaceAll("\\", "/");
  return relativePath.replace(/(README|index)\.md$/i, "").replace(/\/+$/, "");
});

const questions = computed<QuizQuestion[]>(() => quizIndex[labDir.value] ?? []);

// 初始化共享答题状态，供右侧 QuizNavigator 读取。
if (!quizStatus[labDir.value]) {
  quizStatus[labDir.value] = questions.value.map(() => "pending");
}

const selections = ref<Record<string, number | null>>({});
const submitted = ref<Record<string, boolean>>({});

const isSelected = (question: QuizQuestion, optionIndex: number) =>
  selections.value[question.id] === optionIndex;
const isCorrectPick = (question: QuizQuestion, optionIndex: number) =>
  submitted.value[question.id] && optionIndex === question.answer;
const isWrongPick = (question: QuizQuestion, optionIndex: number) =>
  submitted.value[question.id] && isSelected(question, optionIndex) && optionIndex !== question.answer;

function submit(questionId: string) {
  if (selections.value[questionId] === null || selections.value[questionId] === undefined) return;
  submitted.value[questionId] = true;
  const index = questions.value.findIndex((question) => question.id === questionId);
  const statuses = quizStatus[labDir.value];
  if (index >= 0 && statuses) {
    statuses[index] = isSelected(questions.value[index], questions.value[index].answer)
      ? "correct"
      : "wrong";
  }
}

function retry(questionId: string) {
  selections.value[questionId] = null;
  submitted.value[questionId] = false;
  const index = questions.value.findIndex((question) => question.id === questionId);
  const statuses = quizStatus[labDir.value];
  if (index >= 0 && statuses) statuses[index] = "pending";
}
</script>

<template>
  <section v-if="questions.length" class="course-quiz" aria-label="复杂度自测题">
    <article
      v-for="(question, index) in questions"
      :id="`quiz-q${index + 1}`"
      :key="question.id"
      class="course-quiz-question"
    >
      <header class="course-quiz-heading">
        <span class="course-quiz-number">第 {{ index + 1 }} 题</span>
        <p class="course-quiz-stem">{{ question.stem }}</p>
      </header>

      <div v-if="question.codeHtml" class="course-quiz-code">
        <div class="course-quiz-code-bar" aria-hidden="true">
          <i /><i /><i /><span>c</span>
        </div>
        <div class="course-quiz-code-body" v-html="question.codeHtml" />
      </div>

      <fieldset
        class="course-quiz-options"
        :class="submitted[question.id] ? 'is-submitted' : ''"
        :disabled="submitted[question.id]"
      >
        <legend class="course-sr-only">请选择一个答案</legend>
        <label
          v-for="(option, optionIndex) in question.options"
          :key="optionIndex"
          class="course-quiz-option"
          :class="{
            'is-answer': isCorrectPick(question, optionIndex),
            'is-wrong-pick': isWrongPick(question, optionIndex),
          }"
        >
          <input
            v-model="selections[question.id]"
            type="radio"
            :name="question.id"
            :value="optionIndex"
          />
          <span class="course-quiz-option-mark" aria-hidden="true">{{ optionLabel(optionIndex) }}</span>
          <span class="course-quiz-option-text">{{ option }}</span>
        </label>
      </fieldset>

      <div class="course-quiz-actions">
        <button
          v-if="!submitted[question.id]"
          type="button"
          class="course-button course-button-primary course-quiz-submit"
          :disabled="selections[question.id] === null || selections[question.id] === undefined"
          @click="submit(question.id)"
        >
          提交答案
        </button>
        <button v-else type="button" class="course-button course-button-secondary" @click="retry(question.id)">
          <RotateCcw aria-hidden="true" :size="14" />重新作答
        </button>
      </div>

      <div
        v-if="submitted[question.id]"
        class="course-quiz-feedback"
        :class="isSelected(question, question.answer) ? 'is-correct' : 'is-wrong'"
        aria-live="polite"
      >
        <p class="course-quiz-feedback-heading">
          <CheckCircle2 v-if="isSelected(question, question.answer)" aria-hidden="true" :size="17" />
          <CircleAlert v-else aria-hidden="true" :size="17" />
          {{ isSelected(question, question.answer) ? "回答正确" : "回答错误" }}
        </p>
        <p class="course-quiz-answer">
          正确答案：<strong>{{ optionLabel(question.answer) }}. {{ question.options[question.answer] }}</strong>
        </p>
        <div class="course-quiz-explanation">
          <strong class="course-quiz-explanation-title"><Info aria-hidden="true" :size="14" />题解</strong>
          <p>{{ question.explanation }}</p>
        </div>
      </div>
    </article>
  </section>

  <p v-else class="course-quiz-empty">本 Lab 暂未配置自测题目。</p>
</template>
