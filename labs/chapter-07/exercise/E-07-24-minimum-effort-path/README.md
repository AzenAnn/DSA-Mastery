---
title: "Lab 07-E-24：最小体力消耗路径"
description: "每对右邻、下邻格子只建一条无向边，完成最小体力消耗路径的实现与边界验证。"
order: 115
chapter: 7
labId: "07E24"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-24：最小体力消耗路径

> 题集 T15 · 规划节 7.3。题目来源：改编自 [LeetCode 1631 最小体力消耗路径](https://leetcode.cn/problems/path-with-minimum-effort/)。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：每对右邻、下邻格子只建一条无向边。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[最小生成树](../../../../content/chapter-07-graph-traversal/02-minimum-spanning-tree.md)。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

在高度网格中从左上到右下，每次只能上下左右移动。路径体力值是相邻格子高度差绝对值的最大值，求可能的最小体力值。单格路径体力为 0。练习用 Kruskal 按高度差合并；也可实现二分阈值加连通性判定作对照。

## 输入格式

第一行 `rows cols`，随后 rows 行、每行 cols 个高度。`1 ≤ rows,cols ≤ 100`，`1 ≤ height ≤ 10^6`。

## 输出格式

输出最小体力值。

### 样例输入

```input
3 3
1 2 2
3 8 2
5 3 5
```

### 样例输出

```output
2
```

### 样例解释

沿高度 1→3→5→3→5 行走，相邻高度差均不超过 2；阈值 1 时起终点不能连通，所以答案为 2。

## 任务

1. 每对右邻、下邻格子只建一条无向边。
2. 按高度差升序合并端点。
3. 起终点首次连通时的边权就是答案。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

目标是最大边权的最小值，不能把路径高度差相加。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton` | 边界 |
| `003-flat` | 边界 |
| `004-single-row` | 边界 |
| `005-single-column` | 边界 |
| `006-detour-beats-direct` | 易错反例 |
| `007-bottleneck-not-sum` | 易错反例 |
| `008-max-height-gap` | 边界 |
| `009-seeded-grid-0` | 正常 |
| `010-seeded-grid-1` | 正常 |
| `011-seeded-grid-2` | 正常 |
| `012-seeded-grid-3` | 正常 |
| `013-seeded-grid-4` | 正常 |
| `014-seeded-grid-5` | 正常 |
| `015-seeded-grid-6` | 正常 |
| `016-seeded-grid-7` | 正常 |
| `017-seeded-grid-8` | 正常 |
| `018-max-grid` | 规模 |
| `019-checkerboard` | 规模 |
| `020-long-corridor` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-24-minimum-effort-path
pnpm lab run labs/chapter-07/exercise/E-07-24-minimum-effort-path --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-24-minimum-effort-path
```

## 复杂度分析

令 V=rows×cols，网格边数 O(V)，Kruskal 时间 O(V log V)，空间 O(V)。二分+BFS 为 O(V log H)，H 是高度差上界。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
目标是最大边权的最小值，不能把路径高度差相加。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
