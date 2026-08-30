import { build } from "esbuild";

/**
 * 把扩展及其运行时依赖打成单个 CommonJS 文件。
 *
 * 这样 .vsix 里不需要 node_modules —— vsce 无法解析 pnpm 的符号链接依赖树，
 * 打包成单文件同时也让学生安装的扩展体积更小。
 * vscode 模块由宿主在运行时提供，必须排除。
 */
await build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  target: "node20",
  format: "cjs",
  external: ["vscode"],
  minify: true,
  sourcemap: false,
  logLevel: "info",
});
