import type { CourseIndex } from "@dsa/course-index";
import { collectCourseIndex } from "@dsa/course-index";
import { defineLoader } from "vitepress";

export declare const data: CourseIndex;

export default defineLoader({
  watch: [
    "content/chapter-*/*.md",
    "labs/chapter-*/theory/*/README.md",
    "labs/chapter-*/exercise/*/README.md",
    "labs/chapter-*/project/*/README.md",
  ],
  load() {
    return collectCourseIndex();
  },
});
