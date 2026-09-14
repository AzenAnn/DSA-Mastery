---
title: "Lab 07-E-14：欧拉回路判定"
description: "统计度数，自环必须计算两次，完成欧拉回路判定的实现与边界验证。"
order: 104
chapter: 7
labId: "07E14"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-14：欧拉回路判定

> 题集 T04 · 规划节 7.1。题目来源：课程原创，参考 [洛谷 P1636](https://www.luogu.com.cn/problem/P1636) 的无向图一笔画背景；原题求最少笔画，本题只判断单笔欧拉回路/路径。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：统计度数，自环必须计算两次。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[DFS 与 BFS 基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

判断无向多重图能否不重复地走遍所有边。所有非零度顶点必须属于同一连通分量，孤立顶点不影响结论。每个自环对度数贡献 2。优先判断欧拉回路；若恰有两个奇度顶点，则有欧拉路径，起点固定为较小的奇度顶点。没有边时约定存在长度为 0 的欧拉回路。

## 输入格式

第一行 `n m`，随后 m 行 `u v`。`1 ≤ n ≤ 10000`，`0 ≤ m ≤ 100000`，顶点 `0..n-1`；允许自环、重边、非连通图。

## 输出格式

存在回路输出 `Eulerian Circuit`；仅存在路径输出 `Eulerian Path s`（同一行）；其余输出 `Not Eulerian`。

### 样例输入

```input
3 3
0 1
1 2
2 0
```

### 样例输出

```output
Eulerian Circuit
```

### 样例解释

三个非零度顶点连通且度数均为 2，因此存在欧拉回路。

## 任务

1. 统计度数，自环必须计算两次。
2. 从最小非零度顶点检查所有有边顶点的连通性。
3. 结合奇度数输出分类和规范起点。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

只有偶度条件不够：两个互不连通的环仍然不可一笔画。

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
pnpm lab:doctor -- labs/chapter-07/exercise/E-07-14-eulerian-classification
pnpm lab:run -- labs/chapter-07/exercise/E-07-14-eulerian-classification --case 001-sample
pnpm lab:score -- labs/chapter-07/exercise/E-07-14-eulerian-classification
```

## 复杂度分析

连通性与度数检查 O(n+m) 时间，邻接表 O(n+m) 空间。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
只有偶度条件不够：两个互不连通的环仍然不可一笔画。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
