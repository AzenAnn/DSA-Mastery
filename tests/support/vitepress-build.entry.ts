import process from "node:process";
import { build } from "vitepress";

const base = process.env["VP_BASE"];

// VitePress 的 outDir 按 process.cwd() 解析，必须传绝对路径。
await build(process.env["VP_ROOT"], {
  outDir: process.env["VP_OUT"]!,
  ...(base === undefined || base === "" ? {} : { base }),
});
