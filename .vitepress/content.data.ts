import { defineLoader } from "vitepress";
import { collectCourseIndex, type CourseIndex } from "./content-index";

export declare const data: CourseIndex;

export default defineLoader({
  watch: ["content/chapter-*/*.md", "labs/chapter-*/lab-*/README.md"],
  load() {
    return collectCourseIndex();
  },
});
