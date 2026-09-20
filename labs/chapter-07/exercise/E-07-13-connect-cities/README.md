---
title: "Lab 07-E-13：最低成本连通所有城市"
description: "按权重升序排序道路，完成最低成本连通所有城市的实现与边界验证。"
order: 113
chapter: 7
labId: "07E13"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "基础"
duration: "60～90 分钟"
---

# Lab 07-E-13：最低成本连通所有城市


## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：按权重升序排序道路。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[最小生成树](../../../../content/chapter-07-graph-traversal/03-minimum-spanning-tree.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

选择若干条无向道路，使所有城市连通且总建设费用最小。只计算选中道路的费用。若无法连通所有城市，返回 -1；单座城市不需要道路。

## 输入格式

第一行 `n m`，之后 m 行 `u v w`。城市编号 `1..n`；`1 ≤ n ≤ 5000`，`0 ≤ m ≤ 10000`，`0 ≤ w ≤ 10^9`。允许重边，不含自环。

## 输出格式

一行最小总费用，不连通输出 `-1`。总费用使用 64 位整数。

### 样例输入

```input
3 3
1 2 1
2 3 2
1 3 9
```

### 样例输出

```output
3
```

### 样例解释

选择费用为 1 和 2 的两条道路即可连通三个城市，最小总费用为 3。

## 任务

1. 按权重升序排序道路。
2. 仅当端点属于不同集合时选边并合并。
3. 检查选边数，输出费用或 -1。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

需要选满 n-1 条边；返回最小生成森林的费用会掩盖不连通。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-singleton` | 边界 |
| `003-disconnected` | 边界 |
| `004-parallel-cheaper-later` | 易错反例 |
| `005-zero-cost` | 易错反例 |
| `006-cycle-cheapest` | 易错反例 |
| `007-large-total` | 易错反例 |
| `008-seeded-weighted-0` | 正常 |
| `009-seeded-weighted-1` | 正常 |
| `010-seeded-weighted-2` | 正常 |
| `011-seeded-weighted-3` | 正常 |
| `012-seeded-weighted-4` | 正常 |
| `013-seeded-weighted-5` | 正常 |
| `014-seeded-weighted-6` | 正常 |
| `015-seeded-weighted-7` | 正常 |
| `016-seeded-weighted-8` | 正常 |
| `017-seeded-weighted-9` | 正常 |
| `018-long-chain` | 规模 |
| `019-dense-equal` | 规模 |
| `020-isolated-last` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-13-connect-cities
pnpm lab run labs/chapter-07/exercise/E-07-13-connect-cities --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-13-connect-cities
```

## 解题思路

将道路按费用从小到大排序，使用并查集合并不同连通分量。每次成功合并就累加费用，最后检查是否选出了 `n-1` 条道路。

## 复杂度分析

Kruskal 排序 O(m log(m+1))，并查集摊还 O(m α(n))，空间 O(n+m)。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
需要选满 n-1 条边；返回最小生成森林的费用会掩盖不连通。
:::

2. Kruskal 结束后如果选边数少于 `n-1`，为什么不能直接返回已累加的费用？这个费用实际表示什么？

::: details 参考思路
选边不足说明图不连通，得到的只是最小生成森林的部分费用，不是覆盖所有城市的生成树答案。必须按题目约定报告无法连通。
:::
