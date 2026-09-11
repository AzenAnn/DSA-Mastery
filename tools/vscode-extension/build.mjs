import { build, context } from "esbuild";
import { NODE_MINIMUM } from "../lab/requirements.mjs";

/**
 * 把扩展及其运行时依赖打成单个 CommonJS 文件。
 *
 * 这样 .vsix 里不需要 node_modules —— vsce 无法解析 pnpm 的符号链接依赖树，
 * 打包成单文件同时也让学生安装的扩展体积更小。
 * vscode 模块由宿主在运行时提供，必须排除。
 */
const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  target: "node20",
  format: "cjs",
  external: ["vscode"],
  minify: true,
  sourcemap: true,
  define: { __LAB_NODE_MINIMUM__: JSON.stringify(NODE_MINIMUM) },
  logLevel: "info",
};
if (process.argv.includes("--watch")) {
  const watcher = await context(options);
  await watcher.watch();
} else await build(options);
