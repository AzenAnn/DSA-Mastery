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
        <p class="course-curriculum-kicker">{{ currentChapter.label }}</p>
        <h1>{{ currentChapter.title }}</h1>
        <p>{{ currentChapter.description }}</p>
        <span class="course-status-badge draft">draft · 内容待完善</span>
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
          <ul v-if="currentChapter.number === 'preface'">
            <li>统一理解课程理论文档与三类 Lab 的作者接口。</li>
            <li>能够按规范创建、测试、评分和 Review 后续题目。</li>
            <li>从站内完整指南直接复制经过自动验证的示例。</li>
          </ul>
          <ul v-else>
            <li>理解本章核心问题、数据表示与算法之间的联系。</li>
            <li>能够比较主要方案的适用条件与复杂度。</li>
            <li>通过已有文章与 Lab 建立可检查的学习成果。</li>
          </ul>
        </div>
        <div>
          <h2>计划栏目</h2>
          <ul v-if="currentChapter.number === 'preface'">
            <li>理论环境与 Markdown 语法展示</li>
            <li>Quiz、Program、Project 更新机制</li>
            <li>本地测试、CI、Review 与发布清单</li>
          </ul>
          <ul v-else-if="currentChapter.number === '0+'">
            <li>Peak Finding</li>
            <li>Union-Find</li>
            <li>数据结构的选择如何影响算法效率</li>
          </ul>
          <ul v-else>
            <li>核心概念与问题模型</li>
            <li>表示、算法与复杂度</li>
            <li>习题、Lab 与边界验证</li>
          </ul>
        </div>
      </section>
      <section class="course-curriculum-resources">
        <h2>已有内容入口</h2>
        <div v-if="currentChapter.lessons.length || currentChapter.labs.length" class="course-curriculum-resource-list">
          <a v-for="lesson in currentChapter.lessons" :key="lesson.url" :href="withBase(lesson.url)">
            <BookOpen aria-hidden="true" :size="18" /><span><strong>{{ lesson.title }}</strong><small>理论文章</small></span><ArrowRight aria-hidden="true" :size="16" />
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
            <span>{{ chapter.label }}</span><strong>{{ chapter.title }}</strong><small>{{ chapter.description }}</small>
          </a>
        </div>
      </section>
    </template>
  </main>
</template>
