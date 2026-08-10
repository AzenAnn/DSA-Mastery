<script setup lang="ts">
import { CircleHelp } from "@lucide/vue";
import { useRoute } from "vitepress";
import { computed } from "vue";
import { findCourseDocument } from "../course";

const route = useRoute();
const document = computed(() => findCourseDocument(route.path));
</script>

<template>
  <aside v-if="document" class="course-document-note">
    <CircleHelp aria-hidden="true" :size="19" />
    <div>
      <strong>发现问题？</strong>
      <p>先记录可复现的依据，再在 Review 中讨论。教材正确性由人工最终确认。</p>
    </div>
  </aside>
</template>
