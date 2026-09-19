---
title: "Lab 07-E-14：连接所有点的最小费用"
description: "维护每个未选点到已选集合的最小曼哈顿距离，完成连接所有点的最小费用的实现与边界验证。"
order: 114
chapter: 7
labId: "07E14"
chapterTitle: "图的遍历与应用"
updated: "2026-09-16"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-14：连接所有点的最小费用

> 题集 T14 · 规划节 7.3。题目来源：改编自 [LeetCode 1584 连接所有点的最小费用](https://leetcode.cn/problems/min-cost-to-connect-all-points/)，坐标数组改为逐行输入。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：维护每个未选点到已选集合的最小曼哈顿距离。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[最小生成树](../../../../content/chapter-07-graph-traversal/03-minimum-spanning-tree.md)。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

平面上任意两点之间都可连接，费用为曼哈顿距离 `|x1-x2|+|y1-y2|`。求将全部点连成一棵树的最小总费用。完全图无需显式保存全部边。

## 输入格式

第一行 n，随后 n 行 `x y`。`1 ≤ n ≤ 1000`，`-10^6 ≤ x,y ≤ 10^6`，点坐标两两不同。

## 输出格式

一行一个整数，表示最小费用；单点输出 0。

### 样例输入

```input
5
0 0
2 2
3 10
5 2
7 0
```

### 样例输出

```output
20
```

### 样例解释

可选的最小生成树总费用为 20；同一答案可能对应多棵树，本题只输出费用。

## 任务

1. 维护每个未选点到已选集合的最小曼哈顿距离。
2. 选择候选距离最小的点并累计费用。
3. 用新点更新剩余点的候选距离。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

不能用欧几里得距离、平方距离或只比较一个坐标轴。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton` | 边界 |
| `003-negative-quadrants` | 易错反例 |
| `004-coordinate-extremes` | 边界 |
| `005-square-ties` | 易错反例 |
| `006-collinear` | 正常 |
| `007-diagonal` | 正常 |
| `008-seeded-points-0` | 正常 |
| `009-seeded-points-1` | 正常 |
| `010-seeded-points-2` | 正常 |
| `011-seeded-points-3` | 正常 |
| `012-seeded-points-4` | 正常 |
| `013-seeded-points-5` | 正常 |
| `014-seeded-points-6` | 正常 |
| `015-seeded-points-7` | 正常 |
| `016-seeded-points-8` | 正常 |
| `017-seeded-points-9` | 正常 |
| `018-max-points` | 规模 |
| `019-grid` | 规模 |
| `020-two-clusters` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-07/exercise/E-07-14-connect-points
pnpm lab:run -- labs/chapter-07/exercise/E-07-14-connect-points --case 001-sample
pnpm lab:score -- labs/chapter-07/exercise/E-07-14-connect-points
```

## 复杂度分析

朴素 Prim 每轮扫描全部点并即时计算边权，时间 O(n²)、辅助空间 O(n)。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
不能用欧几里得距离、平方距离或只比较一个坐标轴。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
