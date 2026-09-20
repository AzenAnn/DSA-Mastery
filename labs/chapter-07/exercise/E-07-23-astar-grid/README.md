---
title: "Lab 07-E-23：A* 网格寻路"
description: "检查端点，初始化 g 与最小堆 (f,g,顶点)，完成A* 网格寻路的实现与边界验证。"
order: 123
chapter: 7
labId: "07E23"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-23：A* 网格寻路


## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：检查端点，初始化 g 与最小堆 (f,g,顶点)。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[A* 寻路：从直觉到实现](../../../../content/chapter-07-graph-traversal/05-astar-visualization.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

0 表示空地，1 表示障碍。从 `(0,0)` 到 `(rows-1,cols-1)`，只允许上下左右移动，每步代价 1。使用 A*，启发式为到终点的曼哈顿距离。求最少移动次数，不可达输出 -1；起点或终点为障碍也不可达。

## 输入格式

第一行 `rows cols`，随后 rows 行，每行 cols 个 0/1。`1 ≤ rows,cols ≤ 100`。

## 输出格式

一行最短路径长度。1×1 空地输出 0，1×1 障碍输出 -1。

### 样例输入

```input
3 3
0 1 0
0 1 0
0 0 0
```

### 样例输出

```output
4
```

### 样例解释

沿第一列下行两步，再沿最后一行右行两步即可到达，共 4 步。

## 任务

1. 检查端点，初始化 g 与最小堆 (f,g,顶点)。
2. 只在找到更小 g 时更新并入堆。
3. 跳过过期条目，终点弹出时返回 g；堆空则不可达。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

不能在首次把终点加入开放集时套用一般加权图的结束规则；按最小 f 弹出并检查过期 g 更稳妥。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton-open` | 边界 |
| `003-singleton-blocked` | 边界 |
| `004-blocked-start` | 边界 |
| `005-blocked-target` | 边界 |
| `006-diagonal-forbidden` | 易错反例 |
| `007-single-row-wall` | 边界 |
| `008-forced-detour` | 易错反例 |
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
pnpm lab:doctor -- labs/chapter-07/exercise/E-07-23-astar-grid
pnpm lab:run -- labs/chapter-07/exercise/E-07-23-astar-grid --case 001-sample
pnpm lab:score -- labs/chapter-07/exercise/E-07-23-astar-grid
```

## 解题思路

先检查起点和终点是否可通行，再令 `f=g+h`，把 `(f,g,顶点)` 放入小根堆。弹出最小状态并松弛相邻格子；一致的曼哈顿启发式保证首次确定终点时路径最优。

## 复杂度分析

令 V=rows×cols，二叉堆 A* 最坏 O(V log V) 时间、O(V) 空间；启发式改善通常探索量，但不改变最坏阶。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
不能在首次把终点加入开放集时套用一般加权图的结束规则；按最小 f 弹出并检查过期 g 更稳妥。
:::

2. 为什么要在终点从开放集弹出时再结束，而不是第一次发现终点就结束？请结合堆中 `f` 值解释。

::: details 参考思路
第一次发现终点只得到一个候选路径，其他节点可能仍有更小的 f 值并最终产生更短路径。只有终点以当前最小优先级弹出时，A* 的最优性条件才允许结束。
:::
