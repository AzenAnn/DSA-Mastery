import oxlint from "@mzwing/oxc-config";

export default oxlint({
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
    // 独立子包，自带 oxlint.config.ts
    "tools/vscode-extension/**",
  ],
});
