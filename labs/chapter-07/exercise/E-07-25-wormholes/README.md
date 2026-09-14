---
title: "Lab 07-E-25：虫洞（Wormholes）"
description: "道路展开成两条正权边，虫洞转成一条负权边，完成虫洞（Wormholes）的实现与边界验证。"
order: 122
chapter: 7
labId: "07E25"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-25：虫洞（Wormholes）

> 题集 T22 · 规划节 7.4。题目来源：参考 [POJ 3259 Wormholes](https://poj.org/problem?id=3259)。核对时原站访问失败；本课程明确采用“全图任意地点存在负环”的完整合同。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：道路展开成两条正权边，虫洞转成一条负权边。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[最短路径](../../../../content/chapter-07-graph-traversal/03-shortest-path.md)。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

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
pnpm lab:doctor -- labs/chapter-07/exercise/E-07-25-wormholes
pnpm lab:run -- labs/chapter-07/exercise/E-07-25-wormholes --case 001-sample
pnpm lab:score -- labs/chapter-07/exercise/E-07-25-wormholes
```

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

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
