import { NODE_MINIMUM } from "@dsa/lab-core";
import { defineConfig } from "tsdown";

/**
 * 扩展及其运行时依赖打成单个 CommonJS 文件。
 * vsce 无法解析 pnpm 的符号链接依赖树，单文件同时也让学生安装的扩展体积更小。
 * vscode 模块由宿主在运行时提供，必须排除。
 */
export default defineConfig({
  entry: "src/extension.ts",
  format: "cjs",
  platform: "node",
  target: "node20",
  outDir: "dist",
  deps: { alwaysBundle: ["**"] },
  outExtensions: () => ({ js: ".js" }),
  external: ["vscode"],
  minify: true,
  sourcemap: true,
  dts: false,
  clean: true,
  define: { __LAB_NODE_MINIMUM__: JSON.stringify(NODE_MINIMUM) },
});
