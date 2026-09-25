import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/setup.ts",
  format: "esm",
  platform: "node",
  outDir: "dist",
  // 学生在 pnpm install 之前就要运行这个安装器，产物必须完全自包含。
  deps: { alwaysBundle: ["**"] },
  outExtensions: () => ({ js: ".js" }),
  sourcemap: false,
  dts: false,
  clean: true,
  shims: true,
});
