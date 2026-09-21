import { execFile } from "node:child_process";
import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { promisify } from "node:util";
import { hashEngineSources } from "@dsa/lab-runner";
import { REPO_ROOT } from "./repo.ts";

const run = promisify(execFile);
// 指纹和锁放在缓存目录，不能放 dist —— tsdown 每次构建都会清空 dist。
const CACHE = path.join(REPO_ROOT, "node_modules", ".cache", "dsa-lab-cli-build");
const STAMP = path.join(CACHE, "sources.sha256");
const LOCK = path.join(CACHE, "build.lock");

/**
 * 判题测试跑的是学生实际执行的那个打包产物，所以先确保它与源码同步。
 *
 * lab-tools 与 lab-cpp 两个 project 都依赖它，globalSetup 会各跑一次；
 * tsdown 带 clean，并发构建会互相删掉对方的产物，因此用指纹跳过 + 文件锁串行化。
 */
export async function setup(): Promise<void> {
  const fingerprint = await hashEngineSources(path.join(REPO_ROOT, "packages"));
  await mkdir(CACHE, { recursive: true });
  for (let attempt = 0; attempt < 900; attempt += 1) {
    if (
      await readFile(STAMP, "utf8").then(
        (value) => value === fingerprint,
        () => false,
      )
    ) {
      return;
    }
    let handle;
    try {
      handle = await open(LOCK, "wx");
    } catch {
      await sleep(200);
      continue;
    }
    try {
      await run("pnpm", ["--filter", "@dsa/lab-cli", "build"], { cwd: REPO_ROOT, shell: process.platform === "win32" });
      await writeFile(STAMP, fingerprint, "utf8");

      return;
    } finally {
      await handle.close();
      await rm(LOCK, { force: true });
    }
  }

  throw new Error("等待判题内核构建超时");
}
