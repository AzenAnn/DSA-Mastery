import process from "node:process";
import { defineConfig } from "vitest/config";

/**
 * 一条 `vitest run` 跑完全部测试。
 *
 * Vitest 5 的调度有三个硬约束，任何一条被破坏都会让并行静默失效：
 * 1. 任务组严格串行，分组依据是 `sequence.groupOrder`（默认 0）。
 * 2. 同组内所有 project 的 `maxWorkers` 必须一致，否则直接抛错。
 * 3. `fileParallelism: false` 会把该 project 压成 maxWorkers=1，并塞进排在最后的独占组。
 *
 * 所以这里所有 project 同属一组，`maxWorkers` 只在根上设一次，
 * 任何 project 都不要再设 `maxWorkers` 或 `fileParallelism`。
 * C++ 项目的并发靠 `env` 压住 make/cmake 的内层扇出，不是靠 worker 数。
 */
export default defineConfig({
  test: {
    reporters: process.env["CI"] === undefined ? ["default"] : ["default", "github-actions"],
    maxWorkers: process.env["CI"] === undefined ? "75%" : "100%",
    teardownTimeout: 60_000,
    // Playwright 的 web-first 断言默认重试 5 秒；兼容层基于 expect.poll，对齐同一预算。
    expect: { poll: { timeout: 10_000, interval: 50 } },

    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["packages/*/test/*.test.ts", "tests/unit/**/*.test.ts"],
          testTimeout: 30_000,
        },
      },
      {
        extends: true,
        test: {
          name: "lab-tools",
          include: ["packages/lab-cli/test/integration/**/*.test.ts"],
          globalSetup: ["./tests/support/lab-cli-build.globalSetup.ts"],
          pool: "forks",
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
      {
        extends: true,
        test: {
          name: "lab-cpp",
          include: ["packages/lab-runner/test/cpp/**/*.test.ts"],
          globalSetup: ["./tests/support/lab-cli-build.globalSetup.ts"],
          pool: "forks",
          testTimeout: 600_000,
          hookTimeout: 600_000,
          // 真正的并发上限：别让 make/cmake 在已经并行的 worker 里再按 nproc 扇出编译器。
          env: { MAKEFLAGS: "-j1", CMAKE_BUILD_PARALLEL_LEVEL: "1", CTEST_PARALLEL_LEVEL: "1" },
        },
      },
      {
        extends: true,
        test: {
          name: "vscode",
          // 统计面板的版式与对比度断言要真浏览器，放在根 tests/ 下才能用到 playwright。
          include: ["apps/vscode-extension/test/*.test.ts", "tests/extension/*.test.ts"],
          testTimeout: 120_000,
        },
      },
      {
        extends: true,
        test: {
          name: "content",
          include: ["tests/content/**/*.test.ts"],
          testTimeout: 120_000,
        },
      },
      {
        extends: true,
        test: {
          name: "docs",
          include: ["tests/docs/**/*.test.ts"],
          testTimeout: 30_000,
        },
      },
      {
        extends: true,
        test: {
          name: "site-audit",
          include: ["tests/site/audit/**/*.test.ts"],
          globalSetup: ["./tests/support/site-build.globalSetup.ts"],
          testTimeout: 120_000,
        },
      },
      {
        extends: true,
        test: {
          name: "site-e2e",
          include: ["tests/site/e2e/**/*.test.ts"],
          globalSetup: ["./tests/support/site-build.globalSetup.ts"],
          setupFiles: ["./tests/support/browser.setup.ts"],
          pool: "forks",
          // 关掉隔离才能让 Chromium 在同一个 worker 里跨文件复用；这些用例只读产物。
          isolate: false,
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
      {
        extends: true,
        test: {
          name: "discovery",
          include: ["tests/site/discovery/**/*.test.ts"],
          pool: "forks",
          // 自动发现必须把临时教材写进真实的 content/ 和 labs/ 才能证明「放进去就能被发现」，
          // 所以它独占一个排在最后的任务组，不与任何读取仓库内容的 project 重叠。
          sequence: { groupOrder: 1 },
          testTimeout: 600_000,
          hookTimeout: 600_000,
        },
      },
    ],
  },
});
