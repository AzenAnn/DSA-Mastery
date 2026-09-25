---
title: "Lab 07-E-28：飞行员配对方案"
description: "邻接表排序去重，完成飞行员配对方案的实现与边界验证。"
order: 128
chapter: 7
labId: "07E28"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-28：飞行员配对方案

> 题目来源：改编自 [洛谷 P2756 飞行员配对方案问题](https://www.luogu.com.cn/problem/P2756)。原题允许任意最大配对，课程版固定 DFS 增广顺序；无配对统一输出 0。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：邻接表排序去重。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[网络流与二分图匹配](../../../../content/chapter-07-graph-traversal/06-network-flow-and-matching.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

编号 1..L 为第一组飞行员，L+1..N 为第二组。每条兼容关系可组成一对，每人至多参与一对。求最大配对并输出规范方案：左顶点从小到大依次尝试 DFS 增广；每个左顶点的邻居升序，右侧 visited 每次增广前清空；扫描到未访问右顶点时先标记，再按“该点未匹配，或其原搭档递归增广成功”更新配对。每次第一次成功即返回。

## 输入格式

第一行 `L N`；之后每行 `u v`，以 `-1 -1` 结束。`1 ≤ L < N ≤ 200`，`1 ≤ u ≤ L < v ≤ N`。兼容关系最多 10000 条，允许重复输入（按同一关系去重）。

## 输出格式

第一行最大配对数 k，接下来 k 行 `u v`，按 u 升序输出上述确定算法的最终配对。k=0 时仅输出一行 0。

### 样例输入

```input
2 4
1 3
1 4
2 3
-1 -1
```

### 样例输出

```output
2
1 4
2 3
```

### 样例解释

升序增广先配 1→3，第二轮把 1 改配给 4，再配 2→3；按左顶点升序输出两对。

## 任务

1. 邻接表排序去重。
2. 严格按约定顺序增广并及时重置 visited。
3. 从最终右侧匹配表恢复按左顶点排列的结果。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

同样达到最大数量的另一种方案，在本课程的规范输出合同下不一定相同；规则必须在实现前读清。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-no-edges` | 边界 |
| `003-single-pair` | 边界 |
| `004-many-left-one-right` | 易错反例 |
| `005-one-left-many-right` | 易错反例 |
| `006-augment-long-chain` | 易错反例 |
| `007-complete-ties` | 易错反例 |
| `008-hall-deficient` | 易错反例 |
| `009-seeded-matching-0` | 正常 |
| `010-seeded-matching-1` | 正常 |
| `011-seeded-matching-2` | 正常 |
| `012-seeded-matching-3` | 正常 |
| `013-seeded-matching-4` | 正常 |
| `014-seeded-matching-5` | 正常 |
| `015-seeded-matching-6` | 正常 |
| `016-seeded-matching-7` | 正常 |
| `017-seeded-matching-8` | 正常 |
| `018-dense` | 规模 |
| `019-large-sparse` | 规模 |
| `020-large-deficient` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-28-pilot-pairing
pnpm lab run labs/chapter-07/exercise/E-07-28-pilot-pairing --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-28-pilot-pairing
```

## 解题思路

将可配对关系建立为二分图，按排序去重后运行增广路匹配。每找到一条增广路就固定一对飞行员，最后按题目要求输出匹配数量和配对方案。

## 复杂度分析

排序后逐左顶点 DFS 增广，时间 O(m log(m+1)+L(m+N))，空间 O(N+m)。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
同样达到最大数量的另一种方案，在本课程的规范输出合同下不一定相同；规则必须在实现前读清。
:::

2. 为什么邻接表排序和 DFS 顺序会影响输出方案，但不影响最大匹配数量？题目为什么还要固定它们？

::: details 参考思路
不同增广顺序可能得到不同的最大匹配，但最大数量由增广路定理决定。固定排序和 DFS 顺序是为了让同一输入产生唯一、可复现的配对输出。
:::
