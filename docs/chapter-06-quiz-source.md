# 第 6 章选择题来源与核对记录

> 适用题库：`lab-06-01-graph-basics-quiz`、`lab-06-02-graph-storage-quiz`
> 核对日期：2026-08-28

本组题目从教材中的图基本术语、性质与存储复杂度习题整理为四选一形式，不作为历年真题标注。题面中的数值和顶点编号仅用于形成可独立作答的等价练习；定义、答案与复杂度结论均按下列至少两类资料交叉核对。

## 核对资料

1. 严蔚敏、吴伟民《数据结构（C 语言版）》：图的定义、术语、邻接矩阵与邻接表。ISBN 978-7-302-14751-0。[Google Books ISBN 检索](https://books.google.com/books?vid=ISBN9787302147510)
2. 王道论坛《数据结构考研复习指导》：图的基本概念、图的存储及经典选择题结论。[王道论坛](https://www.cskaoyan.com/)
3. Cormen 等《Introduction to Algorithms》第 3 版，第 22 章：图的表示与基本图算法。ISBN 978-0-262-03384-8。[Google Books ISBN 检索](https://books.google.com/books?vid=ISBN9780262033848)
4. OpenDSA：Graph Terminology 与 Graph Implementations，用于复核公开定义、矩阵/邻接表空间和操作成本。[Graph Terminology](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/GraphIntro.html) · [Graph Implementations](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/GraphImpl.html)

## 逐题来源映射

| Lab | 题号 | 核心考点 | 主来源 | 交叉核对 |
| --- | --- | --- | --- | --- |
| 06-01 | 01 | 握手定理 | 严蔚敏“图的基本术语” | 王道“顶点的度” |
| 06-01 | 02 | 入度和、出度和 | 严蔚敏“有向图的度” | OpenDSA Graph Terminology |
| 06-01 | 03 | 简单无向图最大边数 | 王道“简单图” | OpenDSA Graph Terminology |
| 06-01 | 04 | 自环的度贡献 | 严蔚敏“顶点和边” | OpenDSA Graph Terminology |
| 06-01 | 05 | 奇数度顶点个数 | 王道“握手定理” | 严蔚敏“顶点的度” |
| 06-01 | 06 | 强连通与弱连通 | 严蔚敏“连通图” | CLRS 第 22 章 |
| 06-01 | 07 | 连通分量与孤立点 | 严蔚敏“连通分量” | OpenDSA Graph Terminology |
| 06-01 | 08 | 路径与简单路径 | 严蔚敏“路径和回路” | OpenDSA Graph Terminology |
| 06-01 | 09 | 无权图路径长度 | 王道“路径长度” | CLRS 第 22 章 |
| 06-01 | 10 | 稀疏图数量级 | 王道“稀疏图与稠密图” | OpenDSA Graph Implementations |
| 06-02 | 01 | 无向邻接矩阵性质 | 严蔚敏“邻接矩阵法” | OpenDSA Graph Implementations |
| 06-02 | 02 | 有向矩阵的行与列 | 王道“邻接矩阵法” | 严蔚敏“有向图邻接矩阵” |
| 06-02 | 03 | 无向邻接表记录数 | 严蔚敏“邻接表法” | CLRS 第 22 章 |
| 06-02 | 04 | 稀疏图表示选型 | 王道“图的存储结构” | OpenDSA Graph Implementations |
| 06-02 | 05 | 矩阵查询与枚举成本 | CLRS 第 22 章 | OpenDSA Graph Implementations |
| 06-02 | 06 | 动态数组邻接表成本 | CLRS 第 22 章 | OpenDSA Graph Implementations |
| 06-02 | 07 | 完整遍历复杂度 | 王道“图的遍历” | CLRS 第 22 章 |
| 06-02 | 08 | 零权边的存在性表示 | 严蔚敏“网的邻接矩阵” | OpenDSA Graph Implementations |
| 06-02 | 09 | 边集数组适用场景 | CLRS Kruskal/Bellman-Ford 相关章节 | 王道“最小生成树/最短路径” |
| 06-02 | 10 | 邻接表与哈希混合索引 | OpenDSA Graph Implementations | CLRS 图的表示 |

## 人工复核提醒

- `answer` 使用 0～3 索引，已按当前选项顺序核对；若重排选项必须同步更新。
- 题库处于 `draft`，发布前仍需 Review Owner 对题意、答案和版权展示方式做独立复核。
- 数学公式按本项目 Markdown/MathJax 语法录入，README 不维护第二份静态答案。
