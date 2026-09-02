# 第 14 章动态规划代码题 Labs

## Goal

在最新 `main` 的 Lab 三分类与稳定编号合同上，为第 14 章动态规划新增 30 个可独立运行、自动评分、可在网站预览的 C++17 Program Lab。每题都要把官方平台题目转写成课程自己的标准输入输出练习，并通过状态定义、转移、边界、计算顺序和测试反例训练可迁移的动态规划能力。

## Background

- 远端 `main` 已合并 PR #122，正式 Lab 路径为 `labs/chapter-CC/<theory|exercise|project>/X-CC-SS-slug/`，旧平铺路径不保留。
- `content/chapter-14-dynamic-programming/` 已有状态设计、记忆化、线性/网格和背包四篇核心教材；`labs/chapter-14/` 尚不存在。
- 用户指定了 30 道题及分组，并要求从新分支、Azen Trellis 任务开始，按现有 Lab 上传与更新机制落地，最后提供本地网站预览。
- 仓库要求第三方题面只作为原型：保留官方来源，使用自己的题面结构、标准输入输出、代码和测试，不复制来源站点代码、完整题解或测试集合。
- 新增 Program Lab 必须有可编译但未完成的 student starter、独立 reference solution、manifest、Makefile、公开测试和作者级验证证据。

## Requirements

### R1 · 分支与任务治理

- 基线是已同步的 `origin/main`，实现分支固定为 `codex/chapter-14-dp-labs`。
- Trellis developer/creator/assignee 均为 `Azen`，任务目录为 `.trellis/tasks/09-01-chapter-14-dp-exercise-labs/`。
- 规划、来源审计、实现清单与最终质量记录都进入该任务目录。

### R2 · 题目范围与稳定身份

- 恰好新增用户指定的 30 道 Program Lab，不删减、不以文章链接替代可运行题目。
- 全部进入 `labs/chapter-14/exercise/`，稳定编号为 `14E01`～`14E30`，目录为 `E-14-SS-kebab-slug`。
- `order` 为 1～30，只控制展示顺序；README `title` 和 H1 固定使用 `Lab 14-E-SS：题目名称`。
- 新章同时保留 `theory/` 和 `project/` 空分类目录及正确的 `.gitkeep`；`exercise/` 有题后不得保留 `.gitkeep`。
- 网站按统一 CourseIndex 自动发现 30 个 Exercise 入口，不新增手写侧栏名单。

### R3 · 课程化题面

- 每题 README 必须包含：学习目标、课程化问题描述、输入格式、输出格式、约束、至少一个样例、状态/转移提示、复杂度、运行与评分、完成清单、思考复盘和官方来源。
- 不直接复制第三方完整题面、图片、代码或测试；允许保留不可替代的数学定义、官方题名、数据范围和来源链接。
- LeetCode 函数接口统一改为可独立运行的标准输入输出协议；README 明确说明适配差异。
- 洛谷题优先保留原有标准输入输出语义，但题面用课程语言重写；若输出存在多解，增加确定性输出合同。
- `14E07` 挖地雷在最大地雷数相同时输出字典序最小的地窖编号序列，保证 tokens 比较器可确定评分。
- 每题只给足以启动推导的提示，不在 student starter 泄露完整实现；reference solution 独立编写。

### R4 · 动态规划教学覆盖

- `14E01`～`14E05` 对应状态设计：计数、最小值、三角形路径、最大子段、相邻互斥。
- `14E06`～`14E08` 对应记忆化搜索：网格下降、DAG 路径还原、矩阵递增路径。
- `14E09`～`14E17` 对应线性/网格：LIS、双向 LIS、逆序时间 DP、网格计数、障碍、最短网格路、同步双人 DP、编辑距离。
- `14E18`～`14E26` 对应背包：0-1、容量填充、完全、精确计数、可行性、最少件数、组合计数、排列计数、多重背包。
- `14E27`～`14E30` 是扩展：分组、混合、依赖背包和“至少达到”的完全背包。
- README 中的状态定义必须包含范围、条件与目标；循环方向必须由依赖关系或物品使用次数解释。

### R5 · 代码与运行合同

- 所有 reference solution 使用 C++17，遵守仓库与 Algo 代码风格，不复制来源平台题解代码。
- 所有 student starter 必须独立编译、读取完整输入、带明确 TODO，并且不能在全部测试上满分。
- 每个 Lab 使用 Schema v1 `program` manifest、共享 `tools/lab/lab.mk` 薄 Makefile、`tokens` 比较器和合理的时间/输出限制。
- 数值可能超过 32 位时使用 `long long`；计数题按官方保证选择有符号 64 位或明确的 32 位上界。
- reference solution 在 Windows/MSVC 与 Linux/GCC/Clang 合同下均不得依赖 VLA、非标准 pragma 或平台专属行为。

### R6 · 测试质量

- 每个 Lab 至少 20 个公开数据点，共至少 600 个 case；每个 Lab 的分值总和为 100。
- 每题测试必须覆盖：官方/等价样例、最小规模、单行/单列或单元素、零值/不可达、单调/重复/全负等结构边界、会击穿常见错误转移或循环方向的易错点、数值范围和至少一个性能形状。
- 测试输入与答案由课程独立设计；保留机器可审计的 case tag，例如 `sample`、`boundary`、`edge`、`wrong-transition`、`overflow`、`stress`。
- 通过独立 JavaScript oracle 生成或复核 `.out`，再由 C++ reference solution 全量验证，避免只用同一份实现自证。
- cases.json、输入和输出文件使用 LF，禁止提交 `.lab-cache`、二进制或构建产物。

### R7 · 发现、验证与预览

- `pnpm run validate:content` 必须显示 Ch.14 的 30 个新 Lab，无编号/标题/路径冲突。
- 30 个 Lab 都通过 `pnpm lab:validate` 和 `pnpm lab:verify`；再运行 Lab 工具、文档、Golden/Make 及项目全量门禁。
- 运行 VitePress build/check，抽查 `14E01`、`14E08`、`14E17`、`14E26`、`14E30` 页面与 Ch.14 Exercise 导航。
- 最终启动可持续访问的本地开发服务器，向用户提供预览 URL；在用户检阅前不推送或创建 PR，除非用户另行要求。

## Acceptance Criteria

- [ ] 当前分支为 `codex/chapter-14-dp-labs`，来自最新 `origin/main`，Trellis 当前任务归属 Azen。
- [ ] `labs/chapter-14/exercise/` 中恰有 `14E01`～`14E30`，编号连续且每题与来源清单一一对应。
- [ ] `theory/`、`exercise/`、`project/` 三分类与 `.gitkeep` 状态满足目录验证器。
- [ ] 30 个 README 均使用稳定标题、课程化题面、明确状态推导和官方来源链接。
- [ ] 30 份 student starter 可编译但不满分，30 份 solution 在各自完整 case 集上满分。
- [ ] 每题至少 20 个测试且总分 100；总 case 数不少于 600，边界/特殊/易错/性能标签均可审计。
- [ ] 独立 oracle 与 C++ solution 的期望输出一致，没有缓存或生成垃圾残留。
- [ ] 内容校验、Lab 专项、全量站点构建和静态链接检查全部通过。
- [ ] 本地预览可打开 Ch.14，并能从 Exercise 分类进入全部 30 个 Lab。
- [ ] 用户收到可访问的本地预览地址；未得到进一步指示前不推送、不建 PR。

## Out of Scope

- 本任务不新增 Ch.14 Theory Quiz 或 Project Lab。
- 不扩写当前五篇 Ch.14 教材正文；仅在确有必要时补充到新 Lab 的站内链接。
- 不复制或整合洛谷/LeetCode 题解区文章，不提交第三方代码、图片或平台测试。
- 不改变全站 Lab schema、编号算法、导航组件或旧 URL 策略。
- 不在本阶段推送分支、创建或合并 PR。

## Risks and Deferred Review

- 30 题 × 20 case 会显著增加仓库文件数和 CI 时长；实现时用小而有判别力的公开 case，加少量紧凑性能数据，避免无意义的大文件。
- 第三方题目的版权与知识正确性需要人类 Review Owner 最终确认；工具通过不能替代发布许可判断。
- 若官方页面在实现期间更新，以任务来源快照记录的 2026-09-01 合同为本批 Lab 基线，后续变化单独评审。
