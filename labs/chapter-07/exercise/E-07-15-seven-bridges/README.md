---
title: "Lab 07-E-15：哥尼斯堡七桥问题"
description: "检查奇度条件并确定规范起点，完成哥尼斯堡七桥问题的实现与边界验证。"
order: 105
chapter: 7
labId: "07E15"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-15：哥尼斯堡七桥问题

> 题集 T05 · 规划节 7.1。题目来源：课程原创：哥尼斯堡七桥问题的无向多重图推广。所提供清单的 POJ 1392 与本题不对应，不能作为本题出处。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：检查奇度条件并确定规范起点。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[DFS 与 BFS 基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

给定桥的两端，输出一次走完每座桥且不重复的路线，或判定不可行。允许同一对地点之间有多座桥以及自环。为使课程判题唯一，使用如下 Hierholzer 规则：有两个奇度顶点时从较小者出发；否则从最小非零度顶点出发；无边时起点为 0。每次从当前点选择 `(邻点编号, 输入边编号)` 最小的尚未使用边入栈；没有可用边时弹出顶点并追加到逆序答案，最后整体反转。

## 输入格式

第一行 `n m`，后 m 行 `u v`。顶点 `0..n-1`，边编号 `1..m`。`1 ≤ n ≤ 10000`，`0 ≤ m ≤ 100000`。允许自环、重边、非连通图。

## 输出格式

不可行输出 `Not Eulerian`。可行时第一行输出 m，第二行输出按上述规则得到的 m+1 个顶点。无边时输出两行 `0` 和 `0`。该规则指定构造顺序，不额外宣称任意贪心行走都能得到合法路线。

### 样例输入

```input
3 3
0 1
1 2
2 0
```

### 样例输出

```output
3
0 1 2 0
```

### 样例解释

从最小非零度顶点 0 开始，规范化 Hierholzer 得到 0→1→2→0，三条边各用一次。

## 任务

1. 检查奇度条件并确定规范起点。
2. 按排序后的邻接表执行栈式 Hierholzer。
3. 检查逆序答案长度为 m+1，反转并输出。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

必须按边编号标记使用状态；只标记顶点或把平行桥合并会漏边。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton-empty` | 边界 |
| `003-many-isolated` | 边界 |
| `004-isolated-zero` | 易错反例 |
| `005-two-disconnected-cycles` | 易错反例 |
| `006-two-odd` | 易错反例 |
| `007-four-odd` | 易错反例 |
| `008-seven-bridges` | 易错反例 |
| `009-self-loop` | 易错反例 |
| `010-parallel-bridges` | 易错反例 |
| `011-bridge-must-be-spliced` | 易错反例 |
| `012-disconnected-loops` | 易错反例 |
| `013-seeded-walk-0` | 正常 |
| `014-seeded-walk-1` | 正常 |
| `015-seeded-walk-2` | 正常 |
| `016-seeded-walk-3` | 正常 |
| `017-seeded-walk-4` | 正常 |
| `018-long-chain` | 规模 |
| `019-many-parallel` | 规模 |
| `020-max-vertices-isolated` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-15-seven-bridges
pnpm lab run labs/chapter-07/exercise/E-07-15-seven-bridges --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-15-seven-bridges
```

## 复杂度分析

排序 O(m log(m+1))，每条边仅使用一次，构造 O(n+m)，空间 O(n+m)。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
必须按边编号标记使用状态；只标记顶点或把平行桥合并会漏边。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
