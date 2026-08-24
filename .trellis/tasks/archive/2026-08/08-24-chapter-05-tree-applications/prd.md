# PRD：第 5 章“树的应用”课程与 Lab 接口

## Goal

把物理 Chapter 05 建设为图片指定的“树的应用”课程，使读者能够从二叉搜索树与 AVL 树继续学习堆、优先队列、赫夫曼编码、并查集、B 树与 B+ 树；同时在章节侧栏开放“本章 Labs”的理论、实验、工程三个空分类接口。完成后先提供本地站点预览，只有用户确认效果无误后才创建面向 `main` 的 Pull Request。

## Background and Confirmed Facts

- 用户指定从最新远端 `main` 新建精确名为 `chapter05` 的分支，开发者身份为 Azen。
- 分支 `chapter05` 已从 `origin/main@557772e` 创建并跟踪远端主分支基线。
- 当前 `origin/main` 的物理 Chapter 05 是 `content/chapter-05-graph/`，含 5 篇“图”页面；`labs/chapter-05/` 有 2 个 README-only 图算法 Lab。课程编排已把这些内容映射到 Ch.6/Ch.7，因此不能直接删除造成回归。
- 图片指定的新 Chapter 05 标题为“树的应用”，包含 5 个专题和 22 个不可遗漏的小节。
- 教材与 Lab 由 VitePress 自动发现；不应手写第二份侧栏或路由清单。
- 教材必须遵守 `docs/THEORY_DOC_STYLE_GUIDE.md`、内容 frontmatter/路由与理论 Markdown 合同。
- Lab 必须遵守 `docs/LAB_AUTHORING_GUIDE.md`、Lab v1 机器接口、命令与验证合同。
- 当前工作只准备 Lab 接口；实际题目、答案、参考实现和测试数据将在后续上传。
- 用户通过截图确认 Chapter 05 只需要显示现有“本章 Labs”接口：理论 Theory、实验 Exercise、工程 Project 三个分类均先显示空状态；本轮不创建任何 Lab 页面，收到题目后再确定类型并上传。
- PR 创建是预览确认后的独立动作；本任务不自行合并 `main`。

## Requirements

### R1 · 章节结构与迁移

- 将 Chapter 05 从“图”改为“树的应用”，使用 `content/chapter-05-tree-applications/` 作为唯一教材源目录。
- 提供 `00-overview.md` 章首页与 5 篇主题文章，建议文件为：
  - `01-binary-search-tree-and-avl.md`
  - `02-heap-and-priority-queue.md`
  - `03-huffman-tree-and-coding.md`
  - `04-disjoint-set-union.md`
  - `05-b-tree-and-b-plus-tree.md`
- 将旧图正文与 Lab 迁移到其课程编排已经对应的物理 Ch.6/Ch.7，更新 frontmatter、文件编号、课程 `lessonSources` / `labSources` 和入站链接，保留知识内容且避免同一物理章出现重复 order。
- 更新 `docs/PROJECT_BLUEPRINT.md` 中 Chapter 05～07 的路线图描述，并修正其他正文指向旧图路径的相对链接，确保没有失效入口。
- 所有页面使用合法 frontmatter、相对链接、唯一 order、`contributors: ["Azen"]` 与真实更新日期；预览阶段保持 `draft`，Owner 完整自检后才可转为 `review`。

### R2 · 图片目录完整性

每一项都必须在对应文章中成为可导航的明确二级或三级标题，并有实质正文、例子或实现说明，不得只在目录中点名。

#### 5.1 二叉搜索树与平衡

1. 5.1.1 二叉搜索树：定义、有序性质、查找、插入、删除（含前驱/后继）
2. 5.1.2 二叉搜索树的实现、复杂度与退化【C/C++】
3. 5.1.3 平衡的思想与旋转操作
4. 5.1.4 AVL 树：平衡因子、四种失衡与单/双旋转、插入、删除【进阶】
5. 5.1.5 AVL 树的实现与复杂度【C/C++】

#### 5.2 堆与优先队列

1. 5.2.1 堆的定义与数组表示（含父/子下标关系）
2. 5.2.2 上浮与下沉、插入与删除堆顶
3. 5.2.3 建堆与 Heapify 的 O(n) 分析、堆排序
4. 5.2.4 优先队列 ADT 与堆实现（Push / Top / Pop，含 `std::priority_queue`）
5. 5.2.5 Top-K 与第 K 大 / 第 K 小【进阶】、多路归并与任务调度【拓展】

#### 5.3 赫夫曼树与赫夫曼编码

1. 5.3.1 带权路径长度 WPL 与最优二叉树
2. 5.3.2 赫夫曼树的构造（贪心 + 优先队列）
3. 5.3.3 赫夫曼编码与前缀编码、编码与解码
4. 5.3.4 实现【C/C++】与数据压缩应用

#### 5.4 并查集

1. 5.4.1 集合划分与树形表示（双亲数组）
2. 5.4.2 基本操作（MakeSet / Find / Union）
3. 5.4.3 优化：路径压缩与按秩 / 按大小合并、复杂度分析【进阶】（含 $\alpha(n)$）
4. 5.4.4 实现【C/C++】与应用【拓展】（动态连通性、Kruskal）

#### 5.5 B 树与 B+ 树

1. 5.5.1 为什么需要多路搜索树（外存与磁盘 I/O）
2. 5.5.2 B 树的定义、查找、插入与分裂、删除与合并借位
3. 5.5.3 B+ 树（定义、叶节点、查找）与 B 树的区别
4. 5.5.4 数据库索引【拓展】

### R3 · 教学质量与排版

- 章首页说明学习路径、前置知识、可检查学习目标、文章分工、Lab 入口和章节知识图谱。
- 每篇文章至少包含：学习目标、术语/不变量、算法或操作过程、复杂度及其前提、关键 C/C++ 片段或伪代码、完整小例子、常见错误或反例、练习、总结。
- 只按语义使用 `definition`、`property`、`intuition`、`example`、`complexity`、`pitfall` 等容器；有限使用 `==关键结论==`，不写任意颜色或样式。
- 公式使用 MathJax；代码使用带语言与文件名的 fenced code，完整程序留给后续 Lab。
- 不引入未经核实的引用、图片或代码；复杂度结论必须写清数据结构和操作前提。
- 术语、符号、下标约定和复杂度表达在 6 篇页面间保持一致，并与 Chapter 04 的树基础自然衔接。

### R4 · Chapter 05 Lab 分类接口

- 复用 `docs/LAB_AUTHORING_GUIDE.md` 4.1 和统一 `CourseIndex` 的现有分类接口，不创建平行组件或手写 Lab 清单。
- Chapter 05 侧栏必须显示一个展开的“本章 Labs”容器，内部固定显示三个分类：理论 Theory、实验 Exercise、工程 Project。
- 在 Chapter 05 尚无 Lab 时，三个分类分别显示“暂无理论型 Lab”“暂无实验型 Lab”“暂无工程型 Lab”，视觉、折叠行为、图标、颜色与截图及既有章节一致。
- 本轮 `labs/chapter-05/` 为空，不创建 README 槽位、`lab.json`、题面、选项、答案、解析、student/solution、cases 或 Project task。
- 收到题目后再用 `lab:new` 选择 Quiz / Program / Project；`lab.json.type` 自动派生分类，README-only Lab 则显式声明 `labCategory`。
- 更新作者指南与 Trellis 内容/前端规范，把“空章节也显示三个分类”记录为可执行合同。

### R5 · 验证、预览与 PR 门禁

- 至少执行目标 Lab 的结构校验（适用时）、`pnpm run validate:content`、`pnpm run test:discovery`、`pnpm run build`、`pnpm run check:site` 与完整 `pnpm test`。
- 在最终静态产物或本地预览中检查 Chapter 05 章首页、5 篇文章、三个空 Lab 分类、站内链接、侧栏/搜索、浅色/深色与桌面/390px 移动端，无页面级横向溢出或控制台错误。
- 启动本地预览并提供可访问地址，等待用户检查。
- 只有用户明确确认预览无问题后，才提交任务相关改动、推送分支并创建目标为 `main` 的 PR；不得自行合并。

## Acceptance Criteria

- [x] `chapter05` 分支基于任务开始时的最新 `origin/main`，Trellis task 的 creator/assignee 均为 Azen。
- [x] 物理 Chapter 05 只保留“树的应用”教材；旧图内容完整迁移到 Ch.6/Ch.7 并继续可访问，不发生重复 order、错误标题或断链。
- [x] 章首页 + 5 篇文章均被站点自动发现，图片中的 22 个小节逐项可在页面标题与实质正文中定位。
- [x] 5 篇文章满足项目理论样式、frontmatter、相对链接、复杂度前提、例子、易错点与练习要求。
- [x] Chapter 05 的“本章 Labs”显示 Theory / Exercise / Project 三个空分类，且 `labs/chapter-05/` 不含伪造题目或占位 Lab 页面。
- [x] 内容、Lab、发现、构建、静态产物与完整测试全部通过，并记录真实命令与结果。
- [x] 本地预览可访问，代表性桌面/移动与浅/暗页面经检查。
- [x] 用户确认预览后才创建 PR；PR 描述包含范围、验证证据、风险、AI 参与和人工复核要求，目标分支为 `main`。

## Out of Scope

- 本轮不扩写旧图算法课程，只做保内容的 Ch.6/Ch.7 路径与元数据迁移。
- 本轮不创建 Chapter 05 Lab 页面，不编造题目、答案、解析、参考实现或测试数据。
- 不新增上传网页、后台服务、数据库、判题器能力或第二套 Lab 导航。
- 不修改 Chapter 04 的知识正文，不调整其他章节编号。
- 不自行批准、合并或部署 PR 到正式 `main`。
