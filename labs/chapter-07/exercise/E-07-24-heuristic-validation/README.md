---
title: "Lab 07-E-24：启发式函数有效性判定"
description: "反向建图，从 t 求所有点到 t 的距离，完成启发式函数有效性判定的实现与边界验证。"
order: 124
chapter: 7
labId: "07E24"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-24：启发式函数有效性判定


## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：反向建图，从 t 求所有点到 t 的距离。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[A* 寻路：从直觉到实现](../../../../content/chapter-07-graph-traversal/05-astar-visualization.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

给定非负权有向图、终点 t 和 k 个非负整数启发式函数。可采纳定义为 `h(t)=0` 且对每点 `h(u)≤d(u,t)`；无法到达 t 时真实距离视为正无穷，因此任意有限非负 h 都不高估。一致定义为 `h(t)=0` 且每条有向边 u→v 满足 `h(u)≤w(u,v)+h(v)`。分别判断两个性质，包括与终点不连通分量中的边。

## 输入格式

第一行 `n m t k`，接下来 m 行 `u v w`，再 k 行、每行 n 个 h 值。编号 `0..n-1`；`1 ≤ n ≤ 200`，`0 ≤ m ≤ 20000`，`1 ≤ k ≤ 100`，`0 ≤ w ≤ 10^9`，`0 ≤ h ≤ 10^12`；允许零权、自环和重边。

## 输出格式

每个函数一行两个单词：先可采纳，再一致；均用 `YES` 或 `NO`。

### 样例输入

```input
3 2 2 3
0 1 1
1 2 1
2 1 0
2 0 0
3 1 0
```

### 样例输出

```output
YES YES
YES NO
NO NO
```

### 样例解释

[2,1,0] 同时可采纳且一致；[2,0,0] 没有高估，但在边 0→1 上违反 2≤1+0；[3,1,0] 高估了点 0 的真实距离，且也不一致。

## 任务

1. 反向建图，从 t 求所有点到 t 的距离。
2. 逐点检查是否高估，对不可达点保留无穷语义。
3. 逐条原图边检查一致性并验证 h(t)=0。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

可采纳不一定一致；一致性必须检查每条边，不能只检查最短路树上的边。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton` | 边界 |
| `003-unreachable-finite-estimate` | 易错反例 |
| `004-goal-normalization` | 易错反例 |
| `005-zero-weight-equality` | 易错反例 |
| `006-directed-only` | 易错反例 |
| `007-parallel-min-weight` | 易错反例 |
| `008-self-loop` | 易错反例 |
| `009-seeded-heuristics-0` | 正常 |
| `010-seeded-heuristics-1` | 正常 |
| `011-seeded-heuristics-2` | 正常 |
| `012-seeded-heuristics-3` | 正常 |
| `013-seeded-heuristics-4` | 正常 |
| `014-seeded-heuristics-5` | 正常 |
| `015-seeded-heuristics-6` | 正常 |
| `016-seeded-heuristics-7` | 正常 |
| `017-seeded-heuristics-8` | 正常 |
| `018-large-distance` | 规模 |
| `019-many-candidates` | 规模 |
| `020-dense-zero-graph` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-24-heuristic-validation
pnpm lab run labs/chapter-07/exercise/E-07-24-heuristic-validation --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-24-heuristic-validation
```

## 解题思路

将原图反向，从终点运行 Dijkstra 得到每个顶点到终点的真实最短距离。逐边检查 `h(u) ≤ w(u,v)+h(v)` 判断一致性，并检查启发式是否满足可采纳条件。

## 复杂度分析

反向 Dijkstra O((n+m) log(n+m+1))，k 次扫描 O(k(n+m))；保存候选与图的空间 O(n+m+kn)。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
可采纳不一定一致；一致性必须检查每条边，不能只检查最短路树上的边。
:::

2. 只检查最短路树上的边为什么不能证明启发式一致？一致性条件实际需要覆盖哪些边？

::: details 参考思路
一致性要求对图中每条有向边满足 `h(u)≤w(u,v)+h(v)`；不在最短路树上的边也可能违反三角不等式，因此必须扫描全部边。
:::
