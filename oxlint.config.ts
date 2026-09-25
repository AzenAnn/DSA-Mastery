import oxlint from "@mzwing/oxc-config";

const config = oxlint({
  type: "app",
  vue: true,
  ignores: [
    ".trellis/**",
    ".vitepress/cache/**",
    ".vitepress/dist/**",
    "dist/**",
    "graphify-out/**",
    "playwright-report/**",
    "test-results/**",
    "apps/vscode-extension/out/**",
    "apps/vscode-extension/media/**",
  ],
  rules: {
    // 测试标题是完整英文句子，自动修复只会把 TUI/MSVC/CLI 这类缩写的首字母改小写
    "vitest/prefer-lowercase-title": "allow",
    // 纯 ESM + Node 22，顶层 await 是正常写法
    "antfu/no-top-level-await": "allow",
    // 这些函数本就返回 Promise，再套一层 async 没有收益
    "typescript/promise-function-async": "allow",
    // 与 oxfmt 直接冲突：oxfmt 把十六进制字面量转小写，这条规则要求大写
    "unicorn/number-literal-case": "allow",
  },
});

export default {
  ...config,
  overrides: [
    ...(config.overrides ?? []),
    {
      // 作者手工运行的审计/生成脚本和 CLI 入口，stdout 输出就是它们的产物
      files: ["packages/course-authoring/src/**", "packages/bootstrap/src/setup.ts"],
      rules: { "no-console": "allow" },
    },
    {
      // 这里的 `${...}` 是 CMake 变量和子进程源码，必须保持字面量
      files: ["packages/lab-cli/src/scaffold.ts", "packages/bootstrap/test/bootstrap.test.ts"],
      rules: { "no-template-curly-in-string": "allow" },
    },
  ],
};
