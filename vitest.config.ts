import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.mjs"],
    // Lab 判题会编译 C++、自动发现会构建站点，且它们共享仓库工作区，必须串行且给足时间。
    fileParallelism: false,
    testTimeout: 600_000,
    hookTimeout: 600_000,
  },
});
