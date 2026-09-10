# 数组思维到链表思维的解题迁移深度文章

## Goal

在第 1 章新增一篇可独立阅读的深度教材，帮助已经会用数组解决线性表题目的学习者，把“下标、元素搬移、双端访问”的解题经验迁移为“游标、节点定位、链接重连和结构不变量”，并能据此判断一道题是否值得、能够以及应当怎样改写为链表解法。

## Background

- 本地 `main` 已于 2026-08-31 快进到 `origin/main` 的 `cb5f214`。
- `content/chapter-01-linear-list/` 当前包含 `order: 0` 到 `order: 5`；新页面应使用 `order: 6`。
- 第 1 章已有顺序表、链表实现、选型与工程扩展内容，但缺少一篇以“做题迁移”为主线、把数组解法系统改写为链表解法的教材。
- 第 1 章现有 Lab 已覆盖单链表逆置、删除倒数第 n 个节点、有序合并、回文、两两交换、循环链表和静态链表，可作为迁移案例与训练路线。
- `.vitepress/content-index.ts` 的第 1 章 `lessonSources` 是站点课程入口的单一来源，新页面需要加入该列表。
- 作者和 Trellis 执行身份为 `Azen`；知识内容在推送前由用户人工检阅。

## Requirements

1. 新建 `content/chapter-01-linear-list/06-array-to-linked-list-problem-solving.md`，使用完整 Chapter 1 frontmatter：
   - `title` 与一级标题语义一致；
   - `order: 6`、`chapter: 1`、`chapterTitle: "线性表"`；
   - `updated: "2026-08-31"`、`contributors: ["Azen"]`、`status: "draft"`。
2. 文章不能停留在顺序表与链表的定义对照，必须建立可重复使用的迁移框架：
   - 区分 ADT、存储表示与算法三个层次；
   - 把“随机访问/下标”“元素搬移”“节点定位”“链接重连”“节点身份”分别建模；
   - 用 `T_total = T_locate + T_modify` 解释复杂度变化；
   - 给出判断“直接迁移、换模型迁移、不应迁移”的决策方法。
3. 深入讲解反转：
   - 数组交换与链表重连的语义差异；
   - 三指针迭代过程、循环不变量、更新顺序、空表/单节点边界；
   - 静态链表版与指针链表版的一一对应；
   - 递归版本的栈空间代价；
   - “只交换节点值”在节点身份有意义时为何不等价。
4. 准确回答 STL 能力边界：
   - 问题核心是 range、迭代器能力和元素操作要求，不是 `struct` 能否使用 STL；
   - 对比 `std::reverse`、`std::list::reverse`、`std::forward_list::reverse` 与自定义裸 `Node*` 链表；
   - 解释前向、双向、随机访问迭代器如何约束 `find`、`reverse`、`sort` 等算法；
   - 区分交换元素值与重连节点。
5. 至少用以下题型展示“数组解法 → 链表解法”的分析过程，并链接对应本地 Lab：
   - 删除倒数第 n 个节点；
   - 合并两个有序序列；
   - 回文判断；
   - 两两交换节点；
   - 循环/约瑟夫类问题；
   - 静态链表反转或合并。
6. 每个代表题型都应明确：数组版依赖的能力、链表版替代指针、需要维护的不变量、边界条件、复杂度和最容易发生的断链/悬空错误；避免只给最终代码。
7. 增加“不能机械转换”的反例，例如二分查找、堆式下标关系、需要频繁随机访问的算法，并解释为什么换用链表会丢掉核心能力。
8. 提供考试可执行的方法：读题识别表示约束、画图、命名指针、先写不变量、按安全顺序改链、检查结构、分析复杂度，并给出一张可复用的迁移复盘卡。
9. 将新页面加入：
   - `content/chapter-01-linear-list/00-overview.md` 的本章内容与推荐阅读顺序；
   - `.vitepress/content-index.ts` 的 Chapter 1 `lessonSources`。
10. 正文优先使用相对 `.md` 链接、现有理论语义容器和带文件名的 C++ fenced code；不新增组件、依赖、图片或完整 Lab 副本。
11. 在最新 `main` 上创建短分支 `codex/ch01-array-to-linked-list-problem-solving`；用户确认前不提交、不推送。

## Acceptance Criteria

- [x] 新页面通过 frontmatter、文件名/order、相对链接和 Chapter 1 一致性校验。
- [x] 文章以做题迁移为主线，覆盖迁移框架、反转、STL/迭代器、至少六类题型、反例、考试流程与复盘卡。
- [x] 关键代码片段是可理解的 C++17，指针更新顺序、不变量、边界和复杂度均有解释。
- [x] 新页面出现在第 1 章总览、侧栏/搜索/prev-next 的统一内容索引中，不维护第二份导航来源。
- [x] `pnpm run validate:content`、`pnpm run test:discovery` 与 `pnpm test` 全部通过。
- [x] 本地 VitePress 预览可访问 `/learn/chapter-01-linear-list/06-array-to-linked-list-problem-solving/`，页面无 Markdown 泄漏、断链、控制台错误或根级横向溢出。
- [x] 向用户提供文章文件和本地预览地址，等待知识正确性与可读性检阅。
- [x] 用户已明确授权提交 PR；提交并推送新分支，但本任务不自行合并到 `main`。

## Out of Scope

- 新增或改写 Chapter 1 Lab、题库、测试数据和学生代码。
- 修改 VitePress 组件、样式、路由合同或引入新的 Markdown 插件。
- 发布、合并到 `main`、替用户完成知识内容的独立 Review Owner 审批。
- 把所有数组算法强行改写成链表算法，或宣称链表是数组的普遍替代品。

## Risks and Deferred Items

- 文章容易与 1.3～1.5 重复；正文应通过链接复用已有定义和工程选型结论，把篇幅集中在迁移推理与做题应用。
- `std::reverse` 与容器成员 `reverse()` 的语义必须措辞准确；知识结论需要用户在本地预览阶段人工复核。
- 完整 `pnpm test` 可能受仓库既有环境或远程图生成影响；若失败，必须记录真实失败范围，不能用局部校验替代全量结论。
