<script setup lang="ts">
import { useData } from "vitepress";
import { computed } from "vue";
import { quizStatus, type QuizItemStatus } from "../quiz-state";

const { page } = useData();

// 与 QuizSet 使用相同的页面→Lab 目录解析逻辑。
const labDir = computed(() => {
  const relativePath = page.value.relativePath.replaceAll("\\", "/");
  return relativePath.replace(/(README|index)\.md$/i, "").replace(/\/+$/, "");
});

const statuses = computed<QuizItemStatus[]>(() => quizStatus[labDir.value] ?? []);

const statusLabel: Record<QuizItemStatus, string> = {
  pending: "未作答",
  correct: "回答正确",
  wrong: "回答错误",
};

function jumpTo(index: number) {
  document.getElementById(`quiz-q${index + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <nav v-if="statuses.length" class="course-quiz-nav" aria-label="答题进度导航">
    <p class="course-quiz-nav-title">答题进度</p>
    <ol class="course-quiz-nav-list">
      <li v-for="(status, index) in statuses" :key="index" :class="`is-${status}`">
        <button
          type="button"
          :aria-label="`第 ${index + 1} 题，${statusLabel[status]}，点击跳转`"
          :title="`第 ${index + 1} 题 · ${statusLabel[status]}`"
          @click="jumpTo(index)"
        >
          {{ index + 1 }}
        </button>
      </li>
    </ol>
  </nav>
</template>
