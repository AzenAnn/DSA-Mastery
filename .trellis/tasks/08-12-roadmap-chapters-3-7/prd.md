# PRD：第 3~7 章课程路线图

## 问题

项目已具备第 0、1 章完整内容与第 2 章（栈与队列）demo，多章节内容框架已验证可行。需要确定后续章节的总体安排，让两章之间的内容有依赖顺序、分工明确、可独立验收。

## 目标

按课程主线规划 5 个后续章节，每个章节独立可计划、可实施、可验收：

| 子任务 | 章节 | 内容分工 | 配套 Labs | 依赖 | 工作量 |
| --- | --- | --- | --- | --- | --- |
| chapter-03-string-and-array | 3 字符串与数组 | 01-string（存储与朴素匹配）/ 02-kmp（KMP 与 next 递推）/ 03-matrix（数组寻址、特殊矩阵压缩） | 字符串匹配工具、稀疏矩阵三元组 | 无强依赖 | 中 |
| chapter-04-tree | 4 树与二叉树 | 01-binary-tree（定义、性质、遍历）/ 02-tree-applications（Huffman、表达式树）/ 03-heap（堆与优先队列） | 二叉树遍历实现、Huffman 编码 | 第 2 章（栈做非递归遍历、队列做层序） | 大 |
| chapter-05-graph | 5 图 | 01-representation（邻接矩阵/邻接表）/ 02-traversal（DFS/BFS）/ 03-applications（MST、最短路径） | BFS 迷宫、Dijkstra 路径 | 第 4 章（树的遍历思维） | 大 |
| chapter-06-search | 6 查找 | 01-binary-search-tree / 02-hash-table（散列与冲突处理） | 散列表实现、BST 增删查 | 第 4 章（树） | 中 |
| chapter-07-sort | 7 排序 | 01-compare-sort（插入/冒泡/快排/归并）/ 02-heap-sort-and-radix（堆排、基数） | 排序稳定性对比、性能基准测试 | 第 4 章（堆） | 中偏大 |

## 规划原则

1. **顺序依依赖而定**：树紧跟栈与队列（非递归遍历、层序直接用第 2 章结构）；图建立在树的遍历思维上；查找的 BST 是树的应用；堆排序依赖堆。
2. **每章同构**：`00-overview + 2~3 篇文章 + 2 个 Lab`，沿用第 2 章 demo 骨架；侧栏与导航零配置自动更新。
3. **角色轮换**：按蓝图第 5 节，第 3 章 xy3 Owner / Azen Review，第 4 章互换，依次交替。
4. **大章可拆 task**：第 4、5 章实施时可按"基础+遍历"与"应用+高级结构"拆两个 task，各自独立验收。

## 范围

- 本 parent task 只承担路线图规划与子任务编排，不直接实现章节内容。
- 子任务启动前各自补全 prd/design/implement 并交由人确认。
- 规划落地时同步更新 `docs/PROJECT_BLUEPRINT.md` 与 `.trellis/spec/project/goals-and-mvp.md`。

## 非目标

- 不排定具体实施日期与周计划（由维护者按课程节奏决定）。
- 不引入超出 VitePress 原生能力的交互或组件。

## 验收标准

1. 5 个子任务均已创建并与 parent 建立父子链接；
2. 蓝图第 5、12 节与 MVP 规范已按本规划更新；
3. `pnpm run validate:content` 不受影响（本次无课程内容改动）；
4. 维护者可在任意子任务上执行 `task.py start` 开始章节实施。
