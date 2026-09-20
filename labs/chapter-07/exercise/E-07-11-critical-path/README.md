---
title: "Lab 07-E-11：关键路径分析（AOE 网）"
description: "正向拓扑求每个事件的最早发生时刻，完成关键路径分析（AOE 网）的实现与边界验证。"
order: 111
chapter: 7
labId: "07E11"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "90～120 分钟"
---

# Lab 07-E-11：关键路径分析（AOE 网）

> 题目来源：课程原创 AOE 网练习。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：正向拓扑求每个事件的最早发生时刻。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[拓扑排序与有向无环图](../../../../content/chapter-07-graph-traversal/02-topological-sort.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

每个顶点表示事件，有向边 u→v 的非负权 w 表示活动持续时间。所有源事件最早在时刻 0 发生，工程要求所有分量、所有汇事件完成。输入为 DAG，可以有多个源点、汇点、孤立事件与平行活动。工程完成时间取所有事件最早时刻的最大值。令全部汇事件的最迟时刻统一为工程完成时间；满足 `ve[u] = vl[v]-w` 的活动为关键活动。

## 输入格式

第一行 `n m`，后 m 行 `u v w`。编号 `0..n-1`；活动编号按输入从 1 开始。`1 ≤ n ≤ 10000`，`0 ≤ m ≤ 100000`，`0 ≤ w ≤ 10^9`；保证无环。

## 输出格式

第一行工程最早完成时间，第二行关键活动数量 k，第三行按输入编号升序输出 k 个编号。k=0 时第三行为空行。使用 64 位整数存储时刻。

### 样例输入

```input
4 3
0 2 3
1 2 2
2 3 5
```

### 样例输出

```output
8
2
1 3
```

### 样例解释

事件 2 最早在时刻 3 发生，工程在时刻 8 完成。活动 1 和 3 没有余量，活动 2 可推迟 1 个单位。

## 任务

1. 正向拓扑求每个事件的最早发生时刻。
2. 统一初始化最迟时刻为全局工期，再逆拓扑取最小值。
3. 按零余量条件检查每条输入活动。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

多个不连通分量必须共用全局完工时间；较短分量中的活动未必关键。

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
pnpm lab:doctor -- labs/chapter-07/exercise/E-07-11-critical-path
pnpm lab:run -- labs/chapter-07/exercise/E-07-11-critical-path --case 001-sample
pnpm lab:score -- labs/chapter-07/exercise/E-07-11-critical-path
```

## 解题思路

先正向拓扑计算事件最早发生时间，再从总工期逆拓扑计算最晚允许时间。对每条活动比较最早开始和最晚开始时间，二者相等的活动属于关键活动。

## 复杂度分析

正向与逆向拓扑 DP O(n+m) 时间，O(n+m) 空间。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
多个不连通分量必须共用全局完工时间；较短分量中的活动未必关键。
:::

2. 为什么关键活动必须相对于全局总工期计算？如果把多个汇点或分量分别计算，会把哪类活动误判为关键？

::: details 参考思路
总工期是所有汇点最早时间的最大值。较短分量中的活动可能有整体余量；分别计算会把它们的局部余量误当成零，错误标为关键活动。
:::
