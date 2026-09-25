---
title: "Lab 07-E-09：最大食物链计数"
description: "源点计数为 1，其余为 0，完成最大食物链计数的实现与边界验证。"
order: 109
chapter: 7
labId: "07E09"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-09：最大食物链计数

> 题目来源：改编自 [洛谷 P4017 最大食物链计数](https://www.luogu.com.cn/problem/P4017)。保持模数与边方向，课程版补充 m=0 和孤立生物的约定。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：源点计数为 1，其余为 0。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[拓扑排序与有向无环图](../../../../content/chapter-07-graph-traversal/02-topological-sort.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

有向边 A→B 表示 A 被 B 捕食。输入保证是 DAG。统计从任意源点（入度 0）到任意汇点（出度 0）的完整链数量，对 80112002 取模。“最大”表示两端无法延长，不是只数长度最长的链。孤立点单独贡献一条长度为 0 的链。

## 输入格式

第一行 `n m`，随后 m 行 `A B`。编号 `1..n`，`1 ≤ n ≤ 5000`，`0 ≤ m ≤ 500000`；无自环、无重边，保证无环。

## 输出格式

一行一个整数，表示完整食物链数量模 80112002。

### 样例输入

```input
4 3
1 3
2 3
3 4
```

### 样例输出

```output
2
```

### 样例解释

完整食物链有 1→3→4 与 2→3→4，共 2 条。

## 任务

1. 源点计数为 1，其余为 0。
2. 拓扑序沿每条边累加计数并取模。
3. 仅汇总出度 0 的顶点。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

应初始化所有源点并汇总所有汇点；每次加法及时取模。

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
pnpm lab doctor labs/chapter-07/exercise/E-07-09-food-chain-count
pnpm lab run labs/chapter-07/exercise/E-07-09-food-chain-count --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-09-food-chain-count
```

## 解题思路

先拓扑排序，再按拓扑顺序把每个顶点的路径数累加给出边终点。源点路径数初始化为 1，其余为 0；每次转移都按题目要求取模。

## 复杂度分析

拓扑排序和路径计数 O(n+m) 时间、O(n+m) 空间。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
应初始化所有源点并汇总所有汇点；每次加法及时取模。
:::

2. 为什么源点路径数初始化为 1，而不是 0？多个源点和多个汇点时应如何汇总答案？

::: details 参考思路
空路径表示从源点开始已有一种走法，所以每个源点初值为 1。拓扑转移后应把所有汇点的路径数相加，而不是只取编号最大或最后处理的汇点。
:::
