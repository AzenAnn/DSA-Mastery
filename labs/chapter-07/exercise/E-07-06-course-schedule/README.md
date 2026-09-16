---
title: "Lab 07-E-06：课程表"
description: "将输入关系转换为 b→a 并统计入度，完成课程表的实现与边界验证。"
order: 106
chapter: 7
labId: "07E06"
chapterTitle: "图的遍历与应用"
updated: "2026-09-16"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "60～90 分钟"
---

# Lab 07-E-06：课程表

> 题集 T06 · 规划节 7.2。题目来源：改编自 [LeetCode 207 课程表](https://leetcode.cn/problems/course-schedule/)，函数返回值改为标准输出 YES/NO。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：将输入关系转换为 b→a 并统计入度。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[有向图与 DFS 基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。对应新节的完整文章尚未纳入当前版本，可先按本题任务步骤完成练习。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

每条先修关系 `(a,b)` 表示必须先完成 b，才能学习 a。判断能否完成所有课程。课程之间只存在先修约束，不限并行数量。

## 输入格式

第一行 `n m`；后 m 行 `a b`。课程 `0..n-1`，`1 ≤ n ≤ 2000`，`0 ≤ m ≤ 10000`；先修对互不相同，允许自依赖，图可能不连通。

## 输出格式

全部课程可以完成时输出 `YES`，否则输出 `NO`。

### 样例输入

```input
4 3
2 0
2 1
3 2
```

### 样例输出

```output
YES
```

### 样例解释

课程 0、1 完成后可以学习 2，最后学习 3，因此可以完成全部课程。

## 任务

1. 将输入关系转换为 b→a 并统计入度。
2. 把所有零入度课程加入队列。
3. 逐个移除并比较处理数量与 n。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

某个分量含环就无法完成所有课程；处理了一部分课程不代表可行。

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
pnpm lab:doctor -- labs/chapter-07/exercise/E-07-06-course-schedule
pnpm lab:run -- labs/chapter-07/exercise/E-07-06-course-schedule --case 001-sample
pnpm lab:score -- labs/chapter-07/exercise/E-07-06-course-schedule
```

## 复杂度分析

Kahn 拓扑排序 O(n+m) 时间，O(n+m) 空间。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
某个分量含环就无法完成所有课程；处理了一部分课程不代表可行。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
