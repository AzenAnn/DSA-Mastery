<script setup lang="ts">
import { ArrowRight, Clock3, FlaskConical } from "@lucide/vue";
import { withBase } from "vitepress";
import { computed } from "vue";
import { getCourseChapters } from "../course";

const chapters = computed(() => getCourseChapters().filter((chapter) => chapter.labs.length));
</script>

<template>
  <main class="course-labs-index">
    <header class="course-labs-hero">
      <div class="course-eyebrow"><FlaskConical aria-hidden="true" :size="15" />实践实验</div>
      <h1>用实验把理解落到代码上</h1>
      <p>每个 Lab 都对应明确目标、建议用时和可验收提交物。先独立实现，再用边界测试与同伴 Review 检查理解是否可靠。</p>
    </header>

    <section v-for="chapter in chapters" :key="chapter.chapter" class="course-lab-group">
      <header class="course-lab-group-heading">
        <span>{{ String(chapter.chapter).padStart(2, "0") }}</span>
        <div><small>CHAPTER</small><h2>{{ chapter.title }}</h2></div>
      </header>
      <div class="course-labs-list">
        <a v-for="lab in chapter.labs" :key="lab.url" class="course-labs-list-card" :href="withBase(lab.url)" target="_self">
          <span class="course-lab-icon"><FlaskConical aria-hidden="true" :size="20" /></span>
          <span class="course-labs-list-copy">
            <small><code v-if="lab.labId">{{ lab.labId }}</code><template v-if="lab.labId"> · </template>第 {{ lab.chapter }} 章 · {{ lab.difficulty || "基础" }}</small>
            <strong>{{ lab.title }}</strong>
            <span>{{ lab.description }}</span>
            <em><Clock3 aria-hidden="true" :size="14" />{{ lab.duration || `约 ${lab.readingMinutes} 分钟` }}</em>
          </span>
          <ArrowRight aria-hidden="true" :size="18" />
        </a>
      </div>
    </section>
  </main>
</template>
