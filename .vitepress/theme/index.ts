import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import CurriculumIndex from "./components/CurriculumIndex.vue";
import HomePage from "./components/HomePage.vue";
import LabsIndex from "./components/LabsIndex.vue";
import QuizSet from "./components/QuizSet.vue";
import Layout from "./Layout.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  // oxlint-disable-next-line typescript/no-unsafe-assignment -- oxlint 的类型后端解析不了 .vue SFC，这一行由 vue-tsc 把关
  Layout,
  enhanceApp({ app }) {
    app.component("HomePage", HomePage);
    app.component("LabsIndex", LabsIndex);
    app.component("QuizSet", QuizSet);
    app.component("CurriculumIndex", CurriculumIndex);
  },
} satisfies Theme;
