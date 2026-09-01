# Implementation Plan

## 1. Review Gate

- [x] 用户确认首批 00～04 五篇的案例深度、至少 15 个完整案例、至少 10 个迁移案例，以及 Lab 三类空侧边栏方案。
- [x] 若用户调整结构，先同步 `prd.md`、`design.md`，再次提交最终规划摘要。
- [x] 用户在最新规划摘要之后明确批准，才运行 `task.py start`。

## 2. Preparation

- [x] 创建 `content/chapter-14-dynamic-programming/`。
- [x] 读取 `trellis-before-dev`、内容/路由/理论 Markdown/验证规范和 `docs/THEORY_DOC_STYLE_GUIDE.md`。
- [x] 为五篇建立来源表、A/B/C 案例清单与代码编译清单；不复制外部题解代码。

## 3. Authoring

- [x] 完成 `00-overview.md`：章节定位、方法判断、全章地图、统一状态设计卡、来源与 Lab 路线。
- [x] 完成 `01-dp-thinking-and-state-design.md`：状态语义、三项条件、四个以上完整典型题和迁移反例。
- [x] 完成 `02-memoization-to-tabulation.md`：递归/缓存/递推/滚动/方案还原和状态 DAG。
- [x] 完成 `03-linear-and-grid-dp.md`：一维、网格、正反向定义、额外维度和空间压缩。
- [x] 完成 `04-knapsack-dp.md`：0-1/完全/多重/分组、可行性/最值/计数、组合/排列和循环方向证明。
- [x] 五篇统一使用 `chapter: 14`、`chapterTitle: "动态规划"`、`contributors: ["Azen"]`、`status: "draft"` 与连续 `order: 0..4`。
- [x] 五篇合计达到 A 级完整案例 ≥15、B 级迁移案例 ≥10；实际为 22 个完整案例、15 个迁移/对比案例，核心代码均为独立 C++17 实现。

## 4. Website Integration

- [x] 更新 `.vitepress/content-index.ts` Chapter 14，按顺序加入 00～04 的 `lessonSources`。
- [x] 增加 `autoLabChapter: 14`，显示本章 Labs 的 Theory、Exercise、Project 三类空槽位。
- [x] 保留现有 outline id、title、description 和 URL。
- [x] 不新增 `labSources`、手写 Lab 标题或空 `labs/chapter-14/`。
- [x] 增加/更新浏览器测试，断言 Chapter 14 三个分类和三个空状态。

## 5. Verification

- [x] 提取并编译所有 22 个完整 C++17 代码块；所有代码块均可独立编译。
- [x] 用最小反例验证滚动数组覆盖方向、0-1 背包倒/正序和组合/排列计数差异。
- [x] 运行 `pnpm run validate:content`。
- [x] 运行 `pnpm run test:discovery`。
- [x] 运行 `pnpm test`。
- [x] 本地预览 Chapter 14 outline 与五篇 route，检查侧栏、前后页、公式、理论容器、代码、表格和控制台。
- [x] 在浅/暗主题与 390px/1440px 下检查根页面溢出与可读性。
- [x] 向用户提供五篇实际文件与本地预览地址进行检阅；用户确认前不提交、不推送。

## 6. Deferred Follow-up

- [ ] 用户批准首批五篇后，为 05～12 按页创建独立 Trellis 写作任务或分阶段子任务。
- [ ] Lab 题型、来源平台、难度与数量另开任务，不在本轮教材阶段固化完整题单。

## Rollback Points

- 分支基线：`Azen-ch14` 从 `origin/main@212f9c0` 创建。
- 本轮回滚只涉及 Chapter 14 五篇、ContentIndex 的 Chapter 14 接入和对应测试，不触碰其他章节。
- 检阅前不提交、不推送、不创建 PR。
