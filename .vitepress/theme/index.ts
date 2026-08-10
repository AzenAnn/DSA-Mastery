import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import Layout from "./Layout.vue";
import HomePage from "./components/HomePage.vue";
import LabsIndex from "./components/LabsIndex.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("HomePage", HomePage);
    app.component("LabsIndex", LabsIndex);
  },
} satisfies Theme;
