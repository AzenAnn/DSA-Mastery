# Ch12 分治与递归整体重构

## Goal

把第 12 章从 5 篇概览式草稿和 15 个旧 Lab，重构为一条可学习、可验证的“递归合同 → 执行模型 → 分治建模 → 合并模式 → 正确性 → 复杂度 → 方法边界”课程路径，并用用户指定的 16 道题形成由基础递归到归并计数进阶的 C++17 实践梯度。

## Background

当前 Ch12 的核心概念已经出现，但文章把函数建模、调用栈、分治模式、证明和复杂度压缩在 4 篇正文中，若干表述不准确，且课程索引没有显式收录本章文章或自动收录本章 Lab。现有 2 个 Theory Lab 和 13 个 Exercise Lab 均为 `draft`，用户要求全部删除并替换为新的 16 道题。

本任务已在最新 `origin/main` 上创建分支 `chapter/ch12-divide-conquer-rebuild`，Trellis 开发者为 Azen。资料与题目合同审计见 `research/source-and-contract-audit.md`。

## Requirements

### 1. 理论文章体系

保留 `content/chapter-12-divide-conquer-recursion/` 这一稳定章节路径，将正文调整为以下 8 篇，文件前缀与 `order` 一致：

| order | 文件 | 标题 | 核心学习成果 |
| ---: | --- | --- | --- |
| 0 | `00-overview.md` | 第 12 章：从自相似问题到分治框架 | 认识本章路线、先修知识、16 个 Lab 的分层关系与完成标准 |
| 1 | `01-recursion-contracts.md` | 递归建模：函数契约、边界与规模递减 | 能用“函数语义、参数、边界、规模度量、返回合并”五问定义递归 |
| 2 | `02-call-stack-and-iteration.md` | 递与归：调用栈、递归树和迭代改写 | 区分调用栈与递归树，分析深度、调用次数及显式栈改写 |
| 3 | `03-divide-conquer-modeling.md` | 分治建模：Divide–Conquer–Combine | 识别单侧、二路、多路、结构分治，准确写出三阶段合同 |
| 4 | `04-combine-patterns.md` | 合并答案：分治算法真正困难的部分 | 掌握标量、序列、计数、结构与结果集五类返回/合并模式 |
| 5 | `05-recursive-correctness.md` | 递归算法的终止性与正确性证明 | 能写终止性证明、强归纳证明、区间不变量与 Combine 引理 |
| 6 | `06-recurrence-complexity.md` | 从递推式到复杂度：递归树与主定理 | 能从调用结构列递推式，使用递归树/主定理并分别分析栈与缓冲区 |
| 7 | `07-strategy-boundaries.md` | 方法选择：递归、分治、迭代、DP 与回溯 | 能根据重叠、独立性、搜索空间、栈深度和输出规模选择方法 |

每篇正文必须：

- 使用准确的定义、前提和复杂度结论，不把“用了递归”直接等同于“用了分治”；
- 至少包含一个可手算的贯穿示例、一个易错点或反例、一组自测问题及折叠参考答案；
- 按语义使用 `definition`、`intuition`、`theorem`、`proof`、`complexity`、`pitfall` 等容器；
- 使用 C++17 示例，代码与正文术语一致，避免提前复制 16 个 Lab 的完整参考答案；
- 在适合处链接 Ch11 的归并/快速排序、Ch14 的记忆化/DP 和未来 Ch15 的回溯；
- 在篇末列出本篇使用的资料或来源，关键事实优先由 OI Wiki、Hello 算法或正式题面支撑；
- 保持 `status: draft`，原正文有实质贡献时保留 `Zhangyf0325` 并加入 `Azen`。

### 2. 16 个 Exercise Lab

删除当前 Ch12 的 2 个 Theory Lab 与 13 个 Exercise Lab，建立以下 16 个 Schema v1 Program Lab：

| ID | 目录 slug | 题目 | 核心方法 |
| --- | --- | --- | --- |
| `12E01` | `memoized-recursive-function` | 洛谷 P1464 Function | 递归合同、记忆化 |
| `12E02` | `power-expression` | 洛谷 P1010 幂次方 | 递归表示、字符串合并 |
| `12E03` | `fractal-totem` | 洛谷 P1498 南蛮图腾 | 自相似图形递归 |
| `12E04` | `powx-n` | LeetCode 50 Pow(x, n) | 二分幂、负指数边界 |
| `12E05` | `prisoner-pardon` | 洛谷 P5461 赦免战俘 | 四分矩阵递归 |
| `12E06` | `secret-cow-code` | 洛谷 P3612 Secret Cow Code | 逆向定位、64 位索引 |
| `12E07` | `kth-smallest-quickselect` | 洛谷 P1923 求第 k 小的数 | quickselect、单侧递归 |
| `12E08` | `sort-an-array` | LeetCode 912 Sort an Array | 归并排序、线性合并 |
| `12E09` | `construct-quad-tree` | LeetCode 427 Construct Quad Tree | 四分结构递归 |
| `12E10` | `tromino-tiling` | 洛谷 P1228 地毯填补问题 | 棋盘覆盖、多路分治 |
| `12E11` | `inversion-count` | 洛谷 P1908 逆序对 | 归并计数 |
| `12E12` | `different-ways-to-add-parentheses` | LeetCode 241 Different Ways to Add Parentheses | 枚举分割点、组合结果集 |
| `12E13` | `beautiful-array` | LeetCode 932 Beautiful Array | 奇偶映射、构造分治 |
| `12E14` | `reverse-pairs` | LeetCode 493 Reverse Pairs | 归并双指针计数 |
| `12E15` | `count-smaller-after-self` | LeetCode 315 Count of Smaller Numbers After Self | 索引归并、逐点计数 |
| `12E16` | `count-of-range-sum` | LeetCode 327 Count of Range Sum | 前缀和、归并窗口计数 |

每个 Lab 必须：

- 位于 `labs/chapter-12/exercise/E-12-SS-<slug>/`，README 标题/H1 与 `labId` 一致；
- 包含完整 README、`lab.json`、三行薄 `Makefile`、可编译非满分 starter、原创满分 solution 和测试；
- README 给出学习目标、先修知识、环境、原创转述题面、来源链接、本地化差异、输入输出、数据范围、正常/边界/错误约定、步骤、完成清单、思考题、题解与精确命令；
- 使用 C++17，solution 不调用题目明确禁止或绕过学习目标的库算法；
- 至少提供 20 个有区分度的公开用例，覆盖 sample、normal、boundary、stress 和已知易错点，分值合计 100；
- `solution` 在 `lab:verify` 中得到 100 分，starter 可编译且非满分，oracle 无漂移；
- 对浮点、图形、大输出、多解题使用 `research/source-and-contract-audit.md` 中冻结的本地合同。

### 3. 课程索引与页面

- 在 `.vitepress/content-index.ts` 的 Ch12 定义中显式列出 8 篇 `lessonSources`。
- 声明 `autoLabChapter: 12`，不维护手写 `labSources`。
- 补充本章 `learningObjectives`、`focusTitle` 与 `focusAreas`，内容与 8 篇正文一致。
- `00-overview.md` 中的 Lab 表格与实际 16 个 ID、路径和教学阶段完全一致。
- Theory 与 Project 没有题目时保留真实空状态，不创建占位 README。

### 4. 删除安全与可回滚性

- 删除目标严格限制为当前 15 个旧 Ch12 Lab 目录和被 8 篇新目录替代的旧正文文件，不触碰其他章节。
- 删除前更新 `docs/CLEANUP_REPORT.md`，记录旧职责、替代路径、引用搜索、决策和 Git 回滚命令。
- 新 Lab 先逐题独立验证，再删除旧 Lab；删除后执行全仓内容发现和页面验证。
- 不提交 `dist/pages`、`.lab-cache`、截图、临时服务文件或其他生成物。

## Out of Scope

- 不修改 Lab Schema、CLI、判题器或新增 SPJ 基础设施。
- 不扩写 Ch11、Ch14、Ch15 正文，只在 Ch12 建立必要的站内链接。
- 不保留旧 Ch12 Lab URL、重定向或兼容副本；旧内容均为未发布草稿。
- 不创建新的 Theory Quiz 或 Project Lab。
- 不把本地适配后的固定输出合同冒充为洛谷/LeetCode 原始判题合同。
- 不暂存、提交或 push；除非用户后续明确授权，交付停留在工作树和本地预览。

## Acceptance Criteria

### 文章与导航

- [ ] Ch12 恰好有 8 篇正文，文件名、`order`、标题和学习路径与本 PRD 一致。
- [ ] 所有正文 frontmatter、相对链接、语义容器、数学式和 C++17 代码通过内容校验。
- [ ] 汉诺塔和主定理的旧错误表述已消失；Ch11/Ch14/Ch15 的方法边界准确。
- [ ] 每篇至少有贯穿示例、易错点/反例、自测与可核对答案。
- [ ] ContentIndex 显式收录 8 篇正文并自动收录 Ch12 Lab；侧栏显示 16 个 Exercise，Theory/Project 显示空状态。

### Labs

- [ ] 旧 2 个 Theory + 13 个 Exercise 目录全部删除，未残留旧 slug 或正文链接。
- [ ] 新建 `12E01`～`12E16` 共 16 个 Program Lab，ID、目录、标题、order 唯一且一致。
- [ ] 每题 README 有正式来源、本地适配说明、精确运行命令和完整学习闭环。
- [ ] 每题至少 20 个有效测试，cases 分值恰好 100；没有只有样例或重复凑数的测试集。
- [ ] 每题 `pnpm lab:validate -- <path>` 与 `pnpm lab:verify -- <path>` 通过；reference=100，starter 可编译且 `<100`，oracle 稳定。
- [ ] `12E04` 覆盖浮点与 `INT_MIN`；`12E03/05/10` 的大输出限制足够；`12E09/10/12/13` 的规范化输出被 README 与测试共同约束；`12E11/14/16` 无 32 位中间值溢出。
- [ ] 至少准备并运行一个已知错误变体或等价的最小反例检查，证明每题测试能抓住其主要错误模型。

### 清理、质量与预览

- [ ] `docs/CLEANUP_REPORT.md` 的 Ch12 条目完整，删除目标、替代物、无外部引用证据与回滚方式可审查。
- [ ] `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm run test:lab-docs`、`pnpm run test:lab-tools` 均有真实通过记录。
- [ ] 本地 base `/` 与 Pages base `/DSA-Mastery/` 的 build、`check:site`、`test:pages` 通过。
- [ ] 在 390px 与 1440px、浅色与深色下检查 overview、代表性长文、图形 Lab、四叉树 Lab 和归并计数 Lab，无根页面横向溢出、断链或控制台错误。
- [ ] 本地开发服务成功启动，并在 Codex 中打开 Ch12 overview 预览页面供用户查看。
- [ ] `git status` 只包含本任务计划内的源码、测试、文档和 Trellis 记录，不包含构建缓存或无关改动。

## Notes

- 开发者：Azen。
- 分支：`chapter/ch12-divide-conquer-rebuild`，base：`main`。
- 任务复杂度高，必须先完成并审查 `prd.md`、`design.md`、`implement.md`，得到用户对最终规划的明确批准后再运行 `task.py start`。
