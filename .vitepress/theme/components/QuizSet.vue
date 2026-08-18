<script setup lang="ts">
import { CheckCircle2, CircleAlert, GraduationCap, Info, RotateCcw } from "@lucide/vue";
import { useData } from "vitepress";
import { computed, ref } from "vue";
import { data as quizIndex, type QuizQuestion } from "../../quiz.data";
import { data as reviewIndex } from "../../review.data";
import { quizStatus } from "../quiz-state";

const optionLabel = (index: number) => String.fromCharCode(65 + index);

const { page } = useData();
const props = defineProps<{ block?: string }>();

// 题目数据来自 data loader 扫描的 quiz.json，组件只负责渲染，不内置题目。
// 注意：rewrites 会把 README.md 重写为 index.md，两种文件名都要能匹配。
const labDir = computed(() => {
  const relativePath = page.value.relativePath.replaceAll("\\", "/");
  return relativePath.replace(/(README|index)\.md$/i, "").replace(/\/+$/, "");
});

// 教材页即时复习：review.data 按"教材源路径（去掉 .md）"索引。
// 注意：rewrites 会把 content/...md 重写为 learn/.../index.md，page.relativePath
// 可能是源路径也可能是重写后的虚拟路径，这里统一归一化回 content/... 源键。
const lessonKey = computed(() => {
  const relativePath = page.value.relativePath.replaceAll("\\", "/");
  const withoutExt = relativePath.replace(/\.md$/i, "");
  if (withoutExt.startsWith("content/")) return withoutExt;
  return withoutExt.replace(/^learn\//, "content/").replace(/\/index$/, "");
});

const labQuestions = computed<QuizQuestion[]>(() => quizIndex[labDir.value] ?? []);
const reviewQuestions = computed<QuizQuestion[]>(() => {
  const all = reviewIndex[lessonKey.value] ?? [];
  if (!props.block) return all;
  return all.filter((question) => question.block === props.block);
});
// Lab 自测优先；教材页没有 quiz.json 时回退到本节即时复习题（inline 模式）。
const questions = computed<QuizQuestion[]>(() =>
  labQuestions.value.length > 0 ? labQuestions.value : reviewQuestions.value,
);
const isInline = computed(() => labQuestions.value.length === 0 && reviewQuestions.value.length > 0);
const expanded = ref(false);

// 初始化共享答题状态，供右侧 QuizNavigator 读取（仅 Lab 自测需要）。
if (labQuestions.value.length > 0 && !quizStatus[labDir.value]) {
  quizStatus[labDir.value] = labQuestions.value.map(() => "pending");
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

// 教材正文即时复习：滚到该选项对应的原文句子并短暂高亮。
function jumpTo(target?: string) {
  if (!target) return;
  const anchor = document.getElementById(target);
  if (!anchor) return;
  anchor.scrollIntoView({ behavior: "smooth", block: "center" });
  const block = anchor.closest("p, li, td, div") ?? anchor;
  block.classList.add("course-review-flash");
  window.setTimeout(() => block.classList.remove("course-review-flash"), 2400);
}
</script>

<template>
  <section
    v-if="questions.length"
    class="course-quiz"
    :class="{ 'course-quiz-inline': isInline }"
    :aria-label="isInline ? '本节即时复习' : '选择题自测'"
  >
    <div class="course-quiz-summary" aria-live="polite">
      <strong>答题进度</strong>
      <span>已答 {{ answeredCount }}/{{ questions.length }}</span>
      <span>正确 {{ correctCount }}</span>
      <span>得分 {{ earnedPoints }}/{{ totalPoints }}</span>
    </div>
    <button
      v-if="isInline"
      type="button"
      class="course-review-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <GraduationCap aria-hidden="true" :size="18" />
      <span>{{ expanded ? "收起即时复习" : "立即复习" }}</span>
      <span class="course-review-toggle-count">{{ reviewQuestions.length }} 道</span>
    </button>

    <div v-if="expanded || !isInline">
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
      >
        <legend class="course-sr-only">请选择一个答案</legend>
        <div
          v-for="(option, optionIndex) in question.options"
          :key="optionIndex"
          class="course-quiz-option-row"
        >
          <label
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
              :disabled="submitted[question.id]"
            />
            <span class="course-quiz-option-mark" aria-hidden="true">{{ optionLabel(optionIndex) }}</span>
            <span class="course-quiz-option-text course-quiz-rich" v-html="question.optionHtml[optionIndex]" />
          </label>
          <button
            v-if="isInline && submitted[question.id] && question.optionTargets?.[optionIndex]"
            type="button"
            class="course-quiz-option-ref"
            :aria-label="`回看原文（选项 ${optionLabel(optionIndex)}）`"
            @click="jumpTo(question.optionTargets?.[optionIndex])"
          >
            回看原文
          </button>
        </div>
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
    </div>
  </section>

  <p v-else class="course-quiz-empty">
    {{ isInline ? "本节暂未配置即时复习题。" : "本 Lab 暂未配置自测题目。" }}
  </p>
</template>
