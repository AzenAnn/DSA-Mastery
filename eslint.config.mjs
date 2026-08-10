import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import vue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  globalIgnores([
    ".vitepress/cache/**",
    ".vitepress/dist/**",
    "dist/**",
    "graphify-out/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    files: [".vitepress/**/*.{ts,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs", "*.config.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
]);

export default eslintConfig;
