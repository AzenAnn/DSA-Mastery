---
title: "Lab 07-E-08：找到最终的安全状态"
description: "构建反向图并记录原图出度，完成找到最终的安全状态的实现与边界验证。"
order: 108
chapter: 7
labId: "07E08"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-08：找到最终的安全状态

> 题目来源：改编自 [LeetCode 802 找到最终的安全状态](https://leetcode.cn/problems/find-eventual-safe-states/)，邻接数组改为边表输入，显式输出答案数量。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：构建反向图并记录原图出度。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[拓扑排序与有向无环图](../../../../content/chapter-07-graph-traversal/02-topological-sort.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

没有出边的顶点为终端点。从某点出发的每一种行走选择都最终停在终端点，该点才是安全点。若可以进入有向环并永远继续行走，则不安全。找出所有安全点并升序输出。

## 输入格式

第一行 `n m`，随后 m 行 `u v` 表示 u→v。`1 ≤ n ≤ 10000`，`0 ≤ m ≤ 40000`，顶点 `0..n-1`；允许自环，不含重边。

## 输出格式

第一行输出安全点数量 k，第二行按升序输出 k 个顶点。k=0 时第二行为空行。

### 样例输入

```input
4 3
0 2
1 2
2 3
```

### 样例输出

```output
4
0 1 2 3
```

### 样例解释

图中没有环，所有分支最终都到达终端点 3，因此四个点全部安全。

## 任务

1. 构建反向图并记录原图出度。
2. 从所有出度为 0 的点反向删除。
3. 原图出度最终降为 0 的点组成答案。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

能到达某个终端点不等于安全；同时有通往环和终端点的分支时仍不安全。

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
| `009-self-loop` | 易错反例 |
| `010-disconnected-cycle` | 易错反例 |
| `011-cycle-with-exit` | 易错反例 |
| `012-edge-into-cycle` | 易错反例 |
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
pnpm lab doctor labs/chapter-07/exercise/E-07-08-eventual-safe-states
pnpm lab run labs/chapter-07/exercise/E-07-08-eventual-safe-states --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-08-eventual-safe-states
```

## 解题思路

反向存储每条边，并把原图出度作为待减少的计数。终点出度为零，逐步反向删除能到达安全点的顶点；最后按编号扫描出度已降为零的顶点。

## 复杂度分析

反向图拓扑删除 O(n+m) 时间、O(n+m) 空间。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
能到达某个终端点不等于安全；同时有通往环和终端点的分支时仍不安全。
:::

2. 一个顶点同时能到达终点和环时为什么仍然不安全？请从“任意路径最终终止”的定义解释反向出度算法。

::: details 参考思路
安全要求从该顶点出发的每条路径最终都到达终点；只要存在一条进入环的路径就不满足。反向算法只有在一个顶点的所有出边都已指向安全点时才把它判为安全。
:::
