import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "tsdown";

/** 判题引擎指纹：Project 缓存成绩靠它判断引擎是否变过，必须在构建期定死。 */
async function engineFingerprint(): Promise<string> {
  const directory = path.resolve(import.meta.dirname, "../lab-runner/src");
  const hash = createHash("sha256");
  for (const name of (await readdir(directory)).filter((entry) => entry.endsWith(".ts")).sort()) {
    hash.update(await readFile(path.join(directory, name)));
  }

  return hash.digest("hex");
}

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
  define: { __LAB_ENGINE_FINGERPRINT__: JSON.stringify(await engineFingerprint()) },
});
