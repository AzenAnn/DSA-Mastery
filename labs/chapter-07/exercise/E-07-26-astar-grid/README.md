---
title: "Lab 07-E-26：A* 网格寻路"
description: "检查端点，初始化 g 与最小堆 (f,g,顶点)，完成A* 网格寻路的实现与边界验证。"
order: 123
chapter: 7
labId: "07E26"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-26：A* 网格寻路

> 题集 T23 · 规划节 7.5。题目来源：课程原创 A* 网格练习。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：检查端点，初始化 g 与最小堆 (f,g,顶点)。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[A* 寻路可视化](../../../../content/chapter-07-graph-applications/04-astar-visualization.md)。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

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
pnpm lab:doctor -- labs/chapter-07/exercise/E-07-26-astar-grid
pnpm lab:run -- labs/chapter-07/exercise/E-07-26-astar-grid --case 001-sample
pnpm lab:score -- labs/chapter-07/exercise/E-07-26-astar-grid
```

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

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
