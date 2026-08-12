# PRD：第 5 章 图

## 目标

图的存储、遍历与典型图算法。课程最复杂的章节之一，建议实施时拆两个 task（表示+遍历 / 算法应用）。

## 内容分工

- 01-representation：邻接矩阵与邻接表、空间对比；
- 02-traversal：DFS 与 BFS（承接第 2 章队列预告）；
- 03-applications：最小生成树（Prim/Kruskal）、最短路径（Dijkstra）。

## 配套 Labs

- BFS 迷宫寻路；
- Dijkstra 最短路径。

## 依赖

第 4 章（树的遍历思维与递归能力）。MST 与最短路算法需补充分治/贪心思想说明。

## 验收标准

- 参考 `.trellis/spec/content/frontmatter-and-routing.md` 与 `labs.md`；
- `pnpm run validate:content`、`build`、`check:site` 通过；
- 算法复杂度推导必须说明前提（堆优化 vs 朴素实现）。

## 归属

- Chapter Owner：xy3（轮换表第 5 章）；Review Owner：Azen。
