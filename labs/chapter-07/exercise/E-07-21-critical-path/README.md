---
title: "Lab 07-E-21：关键路径分析（AOE 网）"
description: "正向拓扑求每个事件的最早发生时刻，完成关键路径分析（AOE 网）的实现与边界验证。"
order: 111
chapter: 7
labId: "07E21"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "90～120 分钟"
---

# Lab 07-E-21：关键路径分析（AOE 网）

> 题集 T11 · 规划节 7.2。题目来源：课程原创 AOE 网练习。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：正向拓扑求每个事件的最早发生时刻。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[有向图与 DFS 基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。对应新节的完整文章尚未纳入当前版本，可先按本题任务步骤完成练习。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

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
pnpm lab doctor labs/chapter-07/exercise/E-07-21-critical-path
pnpm lab run labs/chapter-07/exercise/E-07-21-critical-path --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-21-critical-path
```

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

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
