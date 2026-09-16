import { oxfmt } from "@mzwing/oxc-config";

// 保持仓库既有风格：分号、双引号、单参数箭头函数带括号。
export default oxfmt({
  arrowParens: "always",
  semi: true,
  singleQuote: false,
  ignores: [
    ".trellis/**",
    ".vitepress/cache/**",
    ".vitepress/dist/**",
    "dist/**",
    "graphify-out/**",
    "playwright-report/**",
    "test-results/**",
    // 独立子包，自带 oxfmt.config.ts
    "tools/vscode-extension/**",
    // 教材与 Lab 属于内容，由 validate-content 和 lab schema 把关，不交给代码格式化器
    "content/**",
    "curriculum/**",
    "labs/**",
    "schemas/**",
    "**/*.md",
  ],
});
