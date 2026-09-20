---
title: "Lab 07-E-20：并行课程 III"
description: "把每门课的初始完成时刻设为自身耗时，完成并行课程 III的实现与边界验证。"
order: 110
chapter: 7
labId: "07E20"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "90～120 分钟"
---

# Lab 07-E-20：并行课程 III

> 题集 T10 · 规划节 7.2。题目来源：改编自 [LeetCode 2050 并行课程 III](https://leetcode.cn/problems/parallel-courses-iii/)，改为边表与耗时数组的标准输入。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：把每门课的初始完成时刻设为自身耗时。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[有向图与 DFS 基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。对应新节的完整文章尚未纳入当前版本，可先按本题任务步骤完成练习。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

课程可以无限并行。每条关系 u→v 表示 u 完成后 v 才可开始。一门课必须等所有先修完成。给定每门课的持续时间，求完成全部课程的最早时刻，开始时间为 0。输入保证为 DAG。

## 输入格式

第一行 `n m`，随后 m 行 `u v`，最后一行 n 个正整数 `time[1..n]`。编号 `1..n`，`1 ≤ n ≤ 50000`，`0 ≤ m ≤ 50000`，`1 ≤ time[i] ≤ 10000`；无自环、无重边。

## 输出格式

输出一个整数，即全部课程最早完成时刻。

### 样例输入

```input
4 3
1 3
2 3
3 4
3 2 5 4
```

### 样例输出

```output
12
```

### 样例解释

课程 1、2 分别在时刻 3、2 完成；课程 3 在时刻 8 完成，课程 4 在时刻 12 完成。

## 任务

1. 把每门课的初始完成时刻设为自身耗时。
2. 按拓扑序以 max 更新后继的完成时刻。
3. 取所有课程完成时刻的最大值。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

多个先修取完成时间的最大值；不能取和，也不能让最后处理的先修覆盖较大的值。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton` | 边界 |
| `003-no-edges` | 边界 |
| `004-diamond` | 易错反例 |
| `005-new-small-ready-vertex` | 易错反例 |
| `006-disconnected` | 边界 |
| `007-many-sources` | 正常 |
| `008-many-sinks` | 正常 |
| `009-non-numeric-topological-order` | 易错反例 |
| `010-two-components-different-length` | 易错反例 |
| `011-shortcut-does-not-dominate` | 易错反例 |
| `012-isolated-is-a-chain` | 易错反例 |
| `013-seeded-dag-0` | 正常 |
| `014-seeded-dag-1` | 正常 |
| `015-seeded-dag-2` | 正常 |
| `016-seeded-dag-3` | 正常 |
| `017-seeded-dag-4` | 正常 |
| `018-long-chain` | 规模 |
| `019-layered-many-paths` | 规模 |
| `020-dense-dag` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-20-parallel-courses
pnpm lab run labs/chapter-07/exercise/E-07-20-parallel-courses --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-20-parallel-courses
```

## 复杂度分析

拓扑排序和最长路径 DP 为 O(n+m) 时间、O(n+m) 空间。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
多个先修取完成时间的最大值；不能取和，也不能让最后处理的先修覆盖较大的值。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
