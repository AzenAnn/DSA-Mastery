import path from "node:path";
import { hashSourceTree } from "@dsa/lab-runner";
import { defineConfig } from "tsdown";

/** 判题引擎指纹：Project 缓存成绩靠它判断引擎是否变过，必须在构建期定死。 */
const engineFingerprint = await hashSourceTree(path.resolve(import.meta.dirname, "../lab-runner/src"));

export default defineConfig({
  entry: "src/cli.ts",
  format: "esm",
  platform: "node",
  outDir: "dist",
  // 学生包和 VSCode 插件都直接 node 跑这个文件，不能有任何外部依赖。
  deps: { alwaysBundle: ["**"] },
  outExtensions: () => ({ js: ".js" }),
  sourcemap: false,
  dts: false,
  clean: ["dist/cli.js"],
  shims: true,
  define: { __LAB_ENGINE_FINGERPRINT__: JSON.stringify(engineFingerprint) },
});
