import type { TestProject } from "vitest/node";
import { fork } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { REPO_ROOT } from "./repo.ts";

const ARTIFACT = path.join(REPO_ROOT, "dist", "pages");
const DONE_FILE = path.join(REPO_ROOT, "dist", ".pages-build.json");
const WATCHDOG_MS = 12 * 60_000;

/**
 * site-audit 与 site-e2e 都声明了这个 globalSetup，vitest 会给每个 project 重新实例化一次模块，
 * 模块级变量守不住单例，标记只能挂在 globalThis 上。
 *
 * 必须只构建一次：VitePress 的 tempDir 固定在 root/.temp，并发构建会互相删掉中间产物；
 * 就算串起来，第二次构建也会在测试读产物的中途把 outDir 重写一遍。
 */
const BUILDING = Symbol.for("dsa-mastery.site-build");

function startBuild(base: string): Promise<void> {
  const child = fork(path.join(REPO_ROOT, "tests/support/vitepress-build.entry.ts"), [], {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    execArgv: ["--experimental-strip-types", "--no-warnings"],
    env: { ...process.env, VP_ROOT: REPO_ROOT, VP_OUT: ARTIFACT, VP_BASE: base },
  });

  let log = "";
  child.stdout?.on("data", (chunk) => (log += chunk));
  child.stderr?.on("data", (chunk) => (log += chunk));
  const watchdog = setTimeout(() => child.kill("SIGKILL"), WATCHDOG_MS);
  watchdog.unref?.();

  return new Promise<void>((resolve) => {
    child.once("exit", (code) => {
      clearTimeout(watchdog);
      void writeFile(DONE_FILE, JSON.stringify({ ok: code === 0, code, log: log.slice(-8000) })).then(resolve, resolve);
    });
  });
}

/**
 * 站点产物只构建一次，产物审计和浏览器冒烟共用。
 *
 * 构建放到后台子进程：VitePress 的 markdown 渲染器是模块级单例，同进程构建两次会互相踩；
 * 而不 await 它，其余 project 全程不用等这次构建。
 */
export async function setup(project: TestProject): Promise<() => Promise<void>> {
  const base = process.env["GITHUB_PAGES_BASE_PATH"] ?? "";
  project.provide("siteArtifact", { root: ARTIFACT, base, doneFile: DONE_FILE });
  const shared = globalThis as typeof globalThis & { [BUILDING]?: Promise<void> };
  if (shared[BUILDING]) return async () => {};

  // 认领必须发生在第一个 await 之前，否则两个 project 的 setup 会在 mkdir 处交错。
  const finished = (async () => {
    await mkdir(path.dirname(DONE_FILE), { recursive: true });
    await rm(DONE_FILE, { force: true });
    await startBuild(base);
  })();
  shared[BUILDING] = finished;

  return async () => {
    await finished;
  };
}
