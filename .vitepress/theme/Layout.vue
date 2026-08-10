<script setup lang="ts">
import { useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import { computed } from "vue";
import { findCourseDocument } from "./course";
import BrandMark from "./components/BrandMark.vue";
import DocumentFooterNote from "./components/DocumentFooterNote.vue";
import DocumentHeader from "./components/DocumentHeader.vue";
import QuizNavigator from "./components/QuizNavigator.vue";

const DefaultLayout = DefaultTheme.Layout;
const route = useRoute();
const currentDocument = computed(() => findCourseDocument(route.path));
</script>

<template>
  <DefaultLayout :class="{ 'course-document-layout': Boolean(currentDocument) }">
    <template #nav-bar-title-before>
      <BrandMark />
    </template>
    <template #nav-bar-title-after>
      <span class="course-brand-subtitle">理论与实验教程</span>
    </template>
    <template #doc-before>
      <DocumentHeader />
    </template>
    <template #doc-footer-before>
      <DocumentFooterNote />
    </template>
    <template #aside-outline-after>
      <QuizNavigator />
    </template>
  </DefaultLayout>
</template>
