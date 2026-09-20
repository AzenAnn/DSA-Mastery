---
title: "Lab 07-E-03：DFS 边分类统计"
description: "为每条边保存独立编号并排序邻接表，完成DFS 边分类统计的实现与边界验证。"
order: 103
chapter: 7
labId: "07E03"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "基础"
duration: "60～90 分钟"
---

# Lab 07-E-03：DFS 边分类统计


## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：为每条边保存独立编号并排序邻接表。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[DFS 与 BFS 基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

给定有向多重图，为每条输入边分类。先从 0 开始 DFS；若仍有未访问顶点，按编号升序继续启动 DFS，形成完整森林。每个顶点按 `(终点编号, 输入边编号)` 升序扫描出边。边编号从 1 开始。首次发现白色顶点的边是 TREE；指向灰色祖先（含自己）是 BACK；指向已完成的后代是 FORWARD；其余为 CROSS。

## 输入格式

第一行 `n m`，随后 m 行 `u v`。顶点为 `0..n-1`。`1 ≤ n ≤ 10000`，`0 ≤ m ≤ 100000`；允许自环、重边和非连通图。

## 输出格式

按输入边编号升序输出 m 行 `id TYPE`，TYPE 为 `TREE`、`BACK`、`FORWARD`、`CROSS`。m=0 时不输出 token。

### 样例输入

```input
5 7
0 2
0 1
1 2
2 0
0 3
3 2
4 0
```

### 样例输出

```output
1 FORWARD
2 TREE
3 TREE
4 BACK
5 TREE
6 CROSS
7 CROSS
```

### 样例解释

DFS 先走 0→1→2，因此输入中的 0→2 是前向边，2→0 是后向边；3→2 和后续 DFS 树中的 4→0 都是横叉边。最终仍按输入边号输出。

## 任务

1. 为每条边保存独立编号并排序邻接表。
2. 用显式栈帧保存下一个邻居位置，同时维护颜色和发现时间。
3. 记录每条边的分类，最后按边编号输出。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

不能把所有指向黑色顶点的边都归为横叉边；重边有各自身份。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton` | 边界 |
| `003-self-loop` | 边界 |
| `004-parallel-edge-forward` | 易错反例 |
| `005-later-tree-cross` | 易错反例 |
| `006-black-descendant-forward` | 易错反例 |
| `007-input-order-vs-neighbor-order` | 易错反例 |
| `008-isolated-root` | 易错反例 |
| `009-seeded-directed-0` | 正常 |
| `010-seeded-directed-1` | 正常 |
| `011-seeded-directed-2` | 正常 |
| `012-seeded-directed-3` | 正常 |
| `013-seeded-directed-4` | 正常 |
| `014-seeded-directed-5` | 正常 |
| `015-seeded-directed-6` | 正常 |
| `016-seeded-directed-7` | 正常 |
| `017-seeded-directed-8` | 正常 |
| `018-long-chain` | 规模 |
| `019-dense-directed` | 规模 |
| `020-many-dfs-roots` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-03-dfs-edge-classification
pnpm lab run labs/chapter-07/exercise/E-07-03-dfs-edge-classification --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-03-dfs-edge-classification
```

## 解题思路

先按边编号和邻点编号确定扫描顺序，再用 DFS 的颜色或发现/完成时间判断边类型。无向边要结合父边编号去重，重边必须按独立边编号分别统计。

## 复杂度分析

邻接排序 O(m log(m+1))，DFS O(n+m)，空间 O(n+m)。显式栈避免深链递归栈溢出。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
不能把所有指向黑色顶点的边都归为横叉边；重边有各自身份。
:::

2. 如果一条边指向已经完成的顶点，为什么还不能只凭“黑色”判断它是横叉边？请结合发现/完成时间或祖先关系说明。

::: details 参考思路
黑色只说明目标顶点已经完成，边可能来自目标的后代，也可能来自另一棵 DFS 树；必须比较时间区间或 DFS 树关系，再区分前向边和横叉边。
:::
