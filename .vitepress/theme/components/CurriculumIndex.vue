<script setup lang="ts">
import { ArrowRight, BookOpen, FlaskConical } from "@lucide/vue";
import { useRoute, withBase } from "vitepress";
import { computed } from "vue";
import { courseIndex } from "../course";

const route = useRoute();
const currentPath = computed(() => decodeURI(route.path).replace(/\/index\.html$/, "/").replace(/\/$/, ""));
const currentPart = computed(() => courseIndex.curriculum.parts.find((part) => currentPath.value.endsWith(`/parts/${part.id}`)));
const allChapters = computed(() => [
  ...courseIndex.curriculum.foundations,
  ...courseIndex.curriculum.parts.flatMap((part) => part.chapters),
]);
const currentChapter = computed(() => allChapters.value.find((chapter) => currentPath.value.endsWith(`/outline/${chapter.id}`)));
const mode = computed(() => currentChapter.value ? "chapter" : currentPart.value ? "part" : "index");
const defaultLearningObjectives = [
  "理解本章核心问题、数据表示与算法之间的联系。",
  "能够比较主要方案的适用条件与复杂度。",
  "通过已有文章与 Lab 建立可检查的学习成果。",
];
const defaultFocusAreas = [
  "核心概念与问题模型",
  "表示、算法与复杂度",
  "习题、Lab 与边界验证",
];
const currentObjectives = computed(() => currentChapter.value?.learningObjectives?.length
  ? currentChapter.value.learningObjectives
  : defaultLearningObjectives);
const currentFocusTitle = computed(() => currentChapter.value?.focusTitle ?? "计划栏目");
const currentFocusAreas = computed(() => {
  if (currentChapter.value?.focusAreas?.length) return currentChapter.value.focusAreas;
  if (currentChapter.value?.number === "0+") {
    return ["Peak Finding", "Union-Find", "数据结构的选择如何影响算法效率"];
  }
  return defaultFocusAreas;
});
const currentChapterStatus = computed(() => {
  const documents = [...(currentChapter.value?.lessons ?? []), ...(currentChapter.value?.labs ?? [])];
  if (!documents.length || documents.some((document) => document.status === "draft")) {
    return { key: "draft", label: "draft · 草稿" } as const;
  }
  if (documents.some((document) => document.status === "review")) {
    return { key: "review", label: "review · 复核中" } as const;
  }
  return { key: "published", label: "published · 已发布" } as const;
});
const groups = computed(() => mode.value === "part" && currentPart.value
  ? [{ id: currentPart.value.id, label: `Part ${currentPart.value.numeral} · ${currentPart.value.title}`, url: currentPart.value.url, chapters: currentPart.value.chapters }]
  : [
      { id: "foundations", label: "基础部分", url: courseIndex.curriculum.url, chapters: courseIndex.curriculum.foundations },
      ...courseIndex.curriculum.parts.map((part) => ({ id: part.id, label: `Part ${part.numeral} · ${part.title}`, url: part.url, chapters: part.chapters })),
    ]);
</script>

<template>
  <main class="course-curriculum-index">
    <header class="course-curriculum-hero">
      <div class="course-eyebrow">DSA MASTERY · CURRICULUM</div>
      <template v-if="mode === 'chapter' && currentChapter">
        <p class="course-curriculum-kicker">Ch.{{ currentChapter.number }}</p>
        <h1>{{ currentChapter.title }}</h1>
        <p>{{ currentChapter.description }}</p>
        <span class="course-status-badge" :class="`is-${currentChapterStatus.key}`">{{ currentChapterStatus.label }}</span>
      </template>
      <template v-else-if="mode === 'part' && currentPart">
        <p class="course-curriculum-kicker">Part {{ currentPart.numeral }}</p>
        <h1>{{ currentPart.title }}</h1>
        <p>本 Part 按课程依赖组织相关章节；已有文章沿用原始页面，缺失内容保留为待完善框架。</p>
      </template>
      <template v-else>
        <h1>课程总目录</h1>
        <p>从内存基础与算法体验出发，依次学习线性结构、树、图、查找、排序和算法思想。</p>
      </template>
    </header>

    <template v-if="mode === 'chapter' && currentChapter">
      <section class="course-curriculum-detail">
        <div>
          <h2>学习目标</h2>
          <ul>
            <li v-for="objective in currentObjectives" :key="objective">{{ objective }}</li>
          </ul>
        </div>
        <div>
          <h2>{{ currentFocusTitle }}</h2>
          <ul>
            <li v-for="area in currentFocusAreas" :key="area">{{ area }}</li>
          </ul>
        </div>
      </section>
      <section class="course-curriculum-resources">
        <h2>已有内容入口</h2>
        <div v-if="currentChapter.lessons.length || currentChapter.labs.length" class="course-curriculum-resource-list">
          <a v-for="lesson in currentChapter.lessons" :key="lesson.url" :href="withBase(lesson.url)">
            <BookOpen aria-hidden="true" :size="18" /><span><strong>{{ lesson.title }}</strong><small>{{ lesson.order === 0 ? "章节导读" : "理论文章" }}</small></span><ArrowRight aria-hidden="true" :size="16" />
          </a>
          <a v-for="lab in currentChapter.labs" :key="lab.url" :href="withBase(lab.url)" target="_self">
            <FlaskConical aria-hidden="true" :size="18" /><span><strong>{{ lab.title }}</strong><small>相关 Lab</small></span><ArrowRight aria-hidden="true" :size="16" />
          </a>
        </div>
        <p v-else class="course-curriculum-empty">本章目前只有目录框架，理论文章、习题与 Lab 将在后续迭代中完善。</p>
      </section>
    </template>

    <template v-else>
      <section v-for="group in groups" :key="group.id" class="course-curriculum-part">
        <header><a :href="withBase(group.url)"><h2>{{ group.label }}</h2><ArrowRight aria-hidden="true" :size="18" /></a></header>
        <div class="course-curriculum-chapters">
          <a v-for="chapter in group.chapters" :key="chapter.id" :href="withBase(chapter.url)">
            <span>Ch.{{ chapter.number }}</span><strong>{{ chapter.title }}</strong><small>{{ chapter.description }}</small>
          </a>
        </div>
      </section>
    </template>
  </main>
</template>
