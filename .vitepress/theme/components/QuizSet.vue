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

const answeredCount = computed(() => questions.value.filter((question) => submitted.value[question.id]).length);
const correctCount = computed(() => questions.value.filter(
  (question) => submitted.value[question.id] && selections.value[question.id] === question.answer,
).length);
const totalPoints = computed(() => questions.value.reduce((total, question) => total + question.points, 0));
const earnedPoints = computed(() => questions.value.reduce(
  (total, question) => total + (submitted.value[question.id] && selections.value[question.id] === question.answer ? question.points : 0),
  0,
));

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
  <section v-if="questions.length" class="course-quiz" aria-label="选择题自测">
    <div class="course-quiz-summary" aria-live="polite">
      <strong>答题进度</strong>
      <span>已答 {{ answeredCount }}/{{ questions.length }}</span>
      <span>正确 {{ correctCount }}</span>
      <span>得分 {{ earnedPoints }}/{{ totalPoints }}</span>
    </div>
    <article
      v-for="(question, index) in questions"
      :id="`quiz-q${index + 1}`"
      :key="question.id"
      class="course-quiz-question"
    >
      <header class="course-quiz-heading">
        <span class="course-quiz-number">第 {{ index + 1 }} 题 · {{ question.points }} 分</span>
        <div class="course-quiz-heading-content">
          <div
            v-if="question.source || question.difficulty || question.topics?.length || question.targetId"
            class="course-quiz-meta"
            aria-label="题目信息"
          >
            <span v-if="question.source"><strong>来源</strong>{{ question.source }}</span>
            <span v-if="question.difficulty"><strong>难度</strong>{{ question.difficulty }}</span>
            <span v-if="question.topics?.length"><strong>考点</strong>{{ question.topics.join("、") }}</span>
            <span v-if="question.targetId"><strong>标识</strong><code>{{ question.targetId }}</code></span>
          </div>
          <div class="course-quiz-stem course-quiz-rich" v-html="question.stemHtml" />
        </div>
      </header>

      <div v-if="question.codeHtml" class="course-quiz-code">
        <div class="course-quiz-code-bar" aria-hidden="true">
          <i /><i /><i /><span>c</span>
        </div>
        <div class="course-quiz-code-body" v-html="question.codeHtml" />
      </div>

      <details v-if="question.hintHtml && !submitted[question.id]" class="course-quiz-hint">
        <summary>查看提示</summary>
        <div class="course-quiz-rich" v-html="question.hintHtml" />
      </details>

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
          <span class="course-quiz-option-text course-quiz-rich" v-html="question.optionHtml[optionIndex]" />
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
          正确答案：<strong>
            {{ optionLabel(question.answer) }}.
            <span class="course-quiz-rich" v-html="question.optionHtml[question.answer]" />
          </strong>
        </p>
        <div class="course-quiz-explanation">
          <strong class="course-quiz-explanation-title"><Info aria-hidden="true" :size="14" />题解</strong>
          <div class="course-quiz-rich" v-html="question.explanationHtml" />
        </div>
      </div>
    </article>
    <details class="course-quiz-answer-overview">
      <summary>答案总览（建议完成全部题目后查看）</summary>
      <ol>
        <li v-for="(question, index) in questions" :key="question.id">
          第 {{ index + 1 }} 题：<strong>{{ optionLabel(question.answer) }}</strong>
        </li>
      </ol>
    </details>
  </section>

  <p v-else class="course-quiz-empty">本 Lab 暂未配置自测题目。</p>
</template>
