<script setup lang="ts">
import { CalendarDays, Clock3, FileText, FlaskConical, Users } from "@lucide/vue";
import { useRoute, withBase } from "vitepress";
import { computed } from "vue";
import { findCourseDocument, getChapterLanding } from "../course";

const route = useRoute();
const document = computed(() => findCourseDocument(route.path));
const statusClass = computed(() => {
  const status = document.value?.status.toLowerCase();
  return status && /^[a-z0-9_-]+$/.test(status) ? `is-${status}` : "is-draft";
});
const duration = computed(() => {
  if (!document.value) return "";
  return document.value.duration || `约 ${document.value.readingMinutes} 分钟阅读`;
});
</script>

<template>
  <header v-if="document" class="course-document-header">
    <nav aria-label="面包屑" class="course-breadcrumbs">
      <a :href="withBase('/')">首页</a>
      <span aria-hidden="true">/</span>
      <a :href="withBase(getChapterLanding(document))">
        {{ document.kind === "lab" ? "Labs" : document.chapterLabel }}
      </a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ document.title }}</span>
    </nav>

    <div class="course-eyebrow">
      <FlaskConical v-if="document.kind === 'lab'" aria-hidden="true" :size="15" />
      <FileText v-else aria-hidden="true" :size="15" />
      {{ document.kind === "lab" ? "动手实验" : `${document.chapterLabel} · ${document.chapterTitle}` }}
    </div>
    <h1>{{ document.title }}</h1>
    <p>{{ document.description }}</p>
    <div class="course-document-meta">
      <span><Clock3 aria-hidden="true" :size="15" />{{ duration }}</span>
      <span><CalendarDays aria-hidden="true" :size="15" />更新于 {{ document.updated }}</span>
      <span><Users aria-hidden="true" :size="15" />{{ document.contributors.join("、") || "待认领" }}</span>
      <span v-if="document.difficulty" class="course-difficulty">{{ document.difficulty }}</span>
      <span class="course-status-badge" :class="statusClass">{{ document.status }}</span>
    </div>
  </header>
</template>
