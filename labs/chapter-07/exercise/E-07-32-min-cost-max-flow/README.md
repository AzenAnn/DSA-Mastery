---
title: "Lab 07-E-32：最小费用最大流"
description: "建立独立正反残量边，容量和费用用 long long，完成最小费用最大流的实现与边界验证。"
order: 130
chapter: 7
labId: "07E32"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "90～120 分钟"
---

# Lab 07-E-32：最小费用最大流

> 题集 T30 · 规划节 7.6。题目来源：参考 [洛谷 P3381 最小费用最大流](https://www.luogu.com.cn/problem/P3381) 改编。课程版明确支持负费用边，但保证初始网络没有负费用有向环，并采用教学规模。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：建立独立正反残量边，容量和费用用 long long。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[图的遍历基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。对应新节的完整文章尚未纳入当前版本，可先按本题任务步骤完成练习。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

有向网络每条边给出容量与单位流量费用。先让 s→t 流量达到最大，再在所有最大流中让总费用最小。允许重边、零容量和相反方向的独立边，不允许自环。初始图无负费用有向环；每次选残量图中最短费用增广路，反向边费用为原费用的相反数。

## 输入格式

第一行 `n m s t`，后 m 行 `u v capacity cost`。编号 `1..n`，`2 ≤ n ≤ 60`，`0 ≤ m ≤ 300`，`s≠t`，`u≠v`，`0 ≤ capacity ≤ 10^6`，`-10^6 ≤ cost ≤ 10^6`。

## 输出格式

一行两个 64 位整数 `maxFlow minCost`。没有增广路时输出 `0 0`；最小费用可能为负数。

### 样例输入

```input
4 4 1 4
1 2 2 1
1 3 1 3
2 4 2 2
3 4 1 1
```

### 样例输出

```output
3 10
```

### 样例解释

经顶点 2 传送 2 单位、每单位费用 3，经顶点 3 传送 1 单位、每单位费用 4，因此最大流为 3，最小费用为 10。

## 任务

1. 建立独立正反残量边，容量和费用用 long long。
2. Bellman-Ford 仅沿正残量容量边求最短费用。
3. 按瓶颈增广，流量与 路径费用×瓶颈 同时累计。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

遇到正费用增广路也必须继续以达到最大流；反向边费用符号错误会使重配后的总费用出错。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-no-edges` | 边界 |
| `003-zero-capacity` | 边界 |
| `004-negative-edge` | 易错反例 |
| `005-parallel-different-costs` | 易错反例 |
| `006-positive-cost-still-maximize-flow` | 易错反例 |
| `007-reverse-cost-required` | 易错反例 |
| `008-opposite-input-edges` | 易错反例 |
| `009-non-default-terminals` | 易错反例 |
| `010-seeded-cost-network-0` | 正常 |
| `011-seeded-cost-network-1` | 正常 |
| `012-seeded-cost-network-2` | 正常 |
| `013-seeded-cost-network-3` | 正常 |
| `014-seeded-cost-network-4` | 正常 |
| `015-seeded-cost-network-5` | 正常 |
| `016-seeded-cost-network-6` | 正常 |
| `017-seeded-cost-network-7` | 正常 |
| `018-large-cost-product` | 规模 |
| `019-many-channels` | 规模 |
| `020-unequal-bottlenecks` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-32-min-cost-max-flow
pnpm lab run labs/chapter-07/exercise/E-07-32-min-cost-max-flow --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-32-min-cost-max-flow
```

## 复杂度分析

参考解用 Bellman-Ford 找增广路，若增广 A 次，时间 O(A·n·m)，空间 O(n+m)。整数容量下 A≤最大流值，但通常每次推送整条路径瓶颈；大规模网络应进一步学习势能+Dijkstra。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
遇到正费用增广路也必须继续以达到最大流；反向边费用符号错误会使重配后的总费用出错。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
