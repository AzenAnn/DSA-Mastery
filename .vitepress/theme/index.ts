import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import Layout from "./Layout.vue";
import HomePage from "./components/HomePage.vue";
import LabsIndex from "./components/LabsIndex.vue";
import QuizSet from "./components/QuizSet.vue";
import CurriculumIndex from "./components/CurriculumIndex.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("HomePage", HomePage);
    app.component("LabsIndex", LabsIndex);
    app.component("QuizSet", QuizSet);
    app.component("CurriculumIndex", CurriculumIndex);
  },
} satisfies Theme;
