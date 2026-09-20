---
title: "Lab 07-E-22：虫洞（Wormholes）"
description: "道路展开成两条正权边，虫洞转成一条负权边，完成虫洞（Wormholes）的实现与边界验证。"
order: 122
chapter: 7
labId: "07E22"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-22：虫洞（Wormholes）


## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：道路展开成两条正权边，虫洞转成一条负权边。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[最短路径](../../../../content/chapter-07-graph-traversal/04-shortest-path.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

道路双向通行且花费正时间；虫洞单向通行，时间减少给定正整数。判断能否从某个地点出发，回到该地点时比出发更早，即全图任意连通分量是否存在负权环。每个测试文件可以包含多组图。

## 输入格式

第一行组数 F，`1 ≤ F ≤ 5`。每组第一行 `n m w`，接下来 m 行道路 `u v t`，再 w 行虫洞 `u v t`。编号 `1..n`；`1 ≤ n ≤ 500`，`0 ≤ m ≤ 2500`，`0 ≤ w ≤ 500`，`1 ≤ t ≤ 10000`。允许重边；虫洞允许自环。

## 输出格式

每组输出一行 `YES`（存在负环）或 `NO`。

### 样例输入

```input
1
3 2 1
1 2 2
2 3 2
3 1 5
```

### 样例输出

```output
YES
```

### 样例解释

沿两条道路花费 2+2，再通过虫洞减少 5，总时间为 -1，形成负环。

## 任务

1. 道路展开成两条正权边，虫洞转成一条负权边。
2. 全部顶点距离初始化为 0。
3. 若第 n 轮仍有严格松弛则存在负环；每组重置状态。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

只从地点 1 初始化距离会漏掉其他分量的负环；所有点初始距离设为 0 等价于增加超级源。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton-empty` | 边界 |
| `003-negative-self-loop` | 边界 |
| `004-disconnected-negative-cycle` | 易错反例 |
| `005-negative-edge-no-cycle` | 易错反例 |
| `006-zero-total-cycle` | 易错反例 |
| `007-road-is-bidirectional` | 易错反例 |
| `008-parallel-road-minimum` | 易错反例 |
| `009-reset-between-groups` | 易错反例 |
| `010-seeded-wormholes-0` | 正常 |
| `011-seeded-wormholes-1` | 正常 |
| `012-seeded-wormholes-2` | 正常 |
| `013-seeded-wormholes-3` | 正常 |
| `014-seeded-wormholes-4` | 正常 |
| `015-seeded-wormholes-5` | 正常 |
| `016-seeded-wormholes-6` | 正常 |
| `017-seeded-wormholes-7` | 正常 |
| `018-max-vertices-empty` | 规模 |
| `019-dense-positive` | 规模 |
| `020-long-negative-chain` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-22-wormholes
pnpm lab run labs/chapter-07/exercise/E-07-22-wormholes --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-22-wormholes
```

## 解题思路

普通道路拆成两个方向的正权边，虫洞只建立一条负权有向边。使用 Bellman-Ford 从指定源点松弛所有边，若第 `n` 轮仍可更新则存在可达负环。

## 复杂度分析

每组 Bellman-Ford 时间 O(n(2m+w))，空间 O(n+m+w)。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
只从地点 1 初始化距离会漏掉其他分量的负环；所有点初始距离设为 0 等价于增加超级源。
:::

2. 为什么本题检测的是全图负环，而不是只检测从地点 1 可达的负环？把所有距离初始化为 0 有什么等价含义？

::: details 参考思路
题目要求任意位置存在负环都报告 YES，因此需要覆盖所有分量。所有距离初始化为 0 等价于增加一个能到达每个顶点、边权为 0 的超级源。
:::
