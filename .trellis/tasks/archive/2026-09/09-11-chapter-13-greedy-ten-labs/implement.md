# 第 13 章新增 10 个贪心 Lab Implementation Plan

**Goal:** 新增 13E06～13E15 十个 C++17 Program Lab，严格满足 5 简单、3 中等、2 困难与每题 20 条、每条 5 分的测试合同。

**Architecture:** 扩展现有第 13 章确定性 fixture 生成器和独立合同检查；每个新目录保持现有 Program Lab 的 manifest、薄 Makefile、starter、solution、README 和 tests 结构。只在用户批准本计划后创建 `codex/chapter-13-greedy-ten-labs` 普通分支并开始实现。

## Task 1：准备目录和会失败的章节合同

**Files:**

- Modify: `scripts/check-chapter-13-greedy-labs.mjs`
- Modify: `scripts/generate-chapter-13-greedy-tests.mjs`

- [ ] 扩展检查脚本的 Lab 清单至 `13E06`～`13E15`，为 10 道题分别编写不调用 C++ solution 的独立 oracle；加入各官方 URL 和概览链接断言。
- [ ] 运行 `node scripts/check-chapter-13-greedy-labs.mjs`，确认正确 RED：第一项应指出缺少 13E06，而非脚本语法或旧题漂移。
- [ ] 运行 `pnpm exec eslint scripts/check-chapter-13-greedy-labs.mjs`。

## Task 2：定义并生成 200 条 fixtures

**Files:**

- Modify: `scripts/generate-chapter-13-greedy-tests.mjs`
- Create: `labs/chapter-13/exercise/E-13-06-*` 至 `E-13-15-*` 下的 `tests/`

- [ ] 为每题写 20 个带稳定 id、tags 和确定性输入的 case；001 固定为 README 首个样例，002～020 按 `design.md` 覆盖表落实边界、反例与压力项。
- [ ] 用纯函数 oracle 生成 `.out` 与每项 5 分的 `cases.json`；生成器仅能写入 15 个明确的第 13 章 Lab 目录。
- [ ] 运行生成器，检查新题各有 20 `.in`、20 `.out` 与 20 项 manifest；现有 5 题 fixture 哈希不变。

## Task 3：实现 5 道简单题（13E06～13E10）

**Files per Lab:**

- Create: `README.md`、`lab.json`、`Makefile`、`student/main.cpp`、`solution/main.cpp`

- [ ] 创建 13E06「种花问题」：局部种植扫描；学生模板先输出固定值，评分必须非满分后再写 solution。
- [ ] 创建 13E07「柠檬水找零」：面额计数和 20 元找零优先级；先验证 starter RED，再写 solution。
- [ ] 创建 13E08「K 次取反后最大化的数组和」：排序、翻负数和奇偶处理；总和使用 `long long`。
- [ ] 创建 13E09「买卖股票的最佳时机」：维护历史最低价格与最大利润。
- [ ] 创建 13E10「卡车上的最大单元数」：按单位数排序的容量分配。
- [ ] 对五题各自运行 `pnpm lab:score -- <path> --target student --no-color`，确认 exit 1 / NOT FULL；随后运行 `pnpm lab:validate` 和 `pnpm lab:verify`，确认 reference 100/100、starter 可编译且非满分。

## Task 4：实现 3 道中等题（13E11～13E13）

- [ ] 创建 13E11「跳跃游戏 II」：按当前可达窗口计算最少跳数；遵守题目“保证可达”输入前提。
- [ ] 创建 13E12「划分字母区间」：以第一行片段数、第二行长度序列作为本地输出；README 明确该 stdio 适配。
- [ ] 创建 13E13「根据身高重建队列」：排序和按 k 插入；fixture 使用可确定序列并输出完整队列。
- [ ] 对每题执行 starter RED、`lab:validate` 与 `lab:verify`，记录 reference 100/100、starter 非满分的结果。

## Task 5：实现 2 道困难题（13E14～13E15）

- [ ] 创建 13E14「分发糖果」：左右两遍扫描，答案用 `long long`；覆盖峰谷、平台和最大长度。
- [ ] 创建 13E15「最低加油次数」：按路程扫描并使用最大堆回溯补油；覆盖 `-1`、恰好到达和 64 位燃料累计。
- [ ] 对每题执行 starter RED、`lab:validate` 与 `lab:verify`，记录 reference 100/100、starter 非满分的结果。

## Task 6：接入概览并关闭章节合同

**Files:**

- Modify: `content/chapter-13-greedy/00-overview.md`
- Modify: `scripts/check-chapter-13-greedy-labs.mjs`

- [ ] 在 13E05 后按稳定编号添加 13E06～13E15 的相对链接，分别说明局部可行性、找零、取反、最低价、容量分配、跳跃窗口、区间闭合、队列插入、双向约束和最大堆补油。
- [ ] 运行章节合同检查，确认输出为 15 个 Lab、300 条测试；复跑生成器并确认 15 题 fixture 哈希不变。

## Task 7：全范围验证和审计

- [ ] 顺序运行 15 次 `pnpm lab:verify -- <path> --no-color`，避免并发启动造成的本机冷启动超时误判。
- [ ] 运行 `pnpm run validate`、`pnpm run test:lab-docs`、`pnpm run test:discovery`、`pnpm run test:lab-make`、`pnpm run build`、`pnpm run check:site` 和最终 `pnpm test`。
- [ ] 运行 `git diff --check`、章节目录与脚本的个人路径/生成声明扫描、fixture/manifest 数量统计和改动范围审计。
- [ ] 对照 PRD 勾选全部验收项，记录实际命令与结果；完成 `trellis-check`、规范同步审查、提交计划和用户授权的 Git/PR 操作。
