---
title: "Lab 07-E-31：最大流（Edmonds-Karp）"
description: "为每条输入边添加容量为 0 的独立反向边，完成最大流（Edmonds-Karp）的实现与边界验证。"
order: 129
chapter: 7
labId: "07E31"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "90～120 分钟"
---

# Lab 07-E-31：最大流（Edmonds-Karp）

> 题集 T29 · 规划节 7.6。题目来源：课程原创经典 Edmonds-Karp 最大流模板。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：为每条输入边添加容量为 0 的独立反向边。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[图的遍历基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。对应新节的完整文章尚未纳入当前版本，可先按本题任务步骤完成练习。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

有向网络中每条边有非负容量。求从 s 到 t 的最大流。允许原图同一方向的平行边和两方向各自独立的边；每条输入边都必须拥有自己的残量反向边。使用 BFS 在残量网络中寻找边数最少的增广路。

## 输入格式

第一行 `n m s t`，随后 m 行 `u v capacity`。编号 `1..n`，`2 ≤ n ≤ 200`，`0 ≤ m ≤ 5000`，`s≠t`，`u≠v`，`0 ≤ capacity ≤ 2×10^9`。

## 输出格式

一行最大流量，使用 64 位整数。s 与 t 不连通输出 0。

### 样例输入

```input
4 4 1 4
1 2 3
1 3 2
2 4 2
3 4 4
```

### 样例输出

```output
4
```

### 样例解释

经顶点 2 和 3 的两条通道分别传送 2 单位流量，总流量为 4；任何额外流量都会超过某条通道的瓶颈容量。

## 任务

1. 为每条输入边添加容量为 0 的独立反向边。
2. BFS 记录父顶点与父边下标。
3. 沿路取瓶颈，更新正反容量并累计流量。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

反向残量边用于撤销旧流量；不能把原图已有的反向输入边当成它。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-no-edges` | 边界 |
| `003-zero-capacity` | 边界 |
| `004-parallel-edges` | 易错反例 |
| `005-opposite-input-edges` | 易错反例 |
| `006-reverse-residual-required` | 易错反例 |
| `007-large-flow` | 易错反例 |
| `008-non-default-terminals` | 易错反例 |
| `009-seeded-network-0` | 正常 |
| `010-seeded-network-1` | 正常 |
| `011-seeded-network-2` | 正常 |
| `012-seeded-network-3` | 正常 |
| `013-seeded-network-4` | 正常 |
| `014-seeded-network-5` | 正常 |
| `015-seeded-network-6` | 正常 |
| `016-seeded-network-7` | 正常 |
| `017-seeded-network-8` | 正常 |
| `018-long-chain` | 规模 |
| `019-many-channels` | 规模 |
| `020-dense-forward` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-31-edmonds-karp
pnpm lab run labs/chapter-07/exercise/E-07-31-edmonds-karp --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-31-edmonds-karp
```

## 复杂度分析

Edmonds-Karp 时间 O(n·m²)，空间 O(n+m)。这是教学规模的模板，容量很大时也不应逐单位增广。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
反向残量边用于撤销旧流量；不能把原图已有的反向输入边当成它。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
