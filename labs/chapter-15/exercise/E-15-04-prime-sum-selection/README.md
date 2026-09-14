---
title: "Lab 15-E-04：选数"
description: "`start, left, sum` 分别记录后续位置起点、还需选择的数量和当前总和。"
order: 4
chapter: 15
labId: "15E04"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "基础"
duration: "35～65 分钟"
---

# Lab 15-E-04：选数

## 学习目标与前置知识

- 明确本题的搜索状态、合法选择和终止条件，并完成可运行的 C++17 解答。
- 用边界输入解释下面列出的常见错误，确认撤销、去重或最短距离的正确性。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/02-classic-problems.md)，以及 C++ 函数、数组/容器和递归；BFS 题还需要队列。

## 题目描述

给定 n 个正整数，从中选择 k 个位置。如果所选数字之和是素数，这次选择就是一种合法方案。求合法方案数。即使两个位置上的数字相同，选择不同位置仍算不同方案。

本 Lab 保留原题的标准输入/输出合同。

### 输入格式

第一行 `n k`，第二行 `n` 个正整数。

### 输出格式

输出和为素数的位置组合数。

### 数据范围

`1 <= n <= 20`，`k < n`，`1 <= x[i] <= 5000000`。选取数量 k 为非负整数；k=0 时只有空选择，和为0，不是素数，因此答案为0。

### 样例输入

```text
4 3
3 7 12 19
```

### 样例输出

```text
1
```

## 状态与边界

`start, left, sum` 分别记录后续位置起点、还需选择的数量和当前总和。

不能对相同数值去重；素数必须大于 1。试除只需检查到平方根，并可预筛这些除数。

## 复杂度目标

枚举 O(k * C(n,k))；每个候选和用不超过 sqrt(S) 的素数试除，最坏 O(C(n,k) * sqrt(S))，S为最大和；辅助空间 O(n + sqrt(S))。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留现有读写框架。调试信息写入标准错误，标准输出只保留答案。测试清单和分值以 `tests/cases.json` 为准，总分 100 分；输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-04-prime-sum-selection
pnpm lab:score -- labs/chapter-15/exercise/E-15-04-prime-sum-selection
```

进入本 Lab 目录后也可运行 `make run`。作者核验命令为：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-04-prime-sum-selection
```

## 完成清单

- [ ] 学生程序编译成功，严格评分为 100/100。
- [ ] 能说明每个状态变量和终止条件，并解释复杂度。
- [ ] 能用一个最小反例说明本题的关键边界或常见错误。
- [ ] 输出的顺序、数量和空结果处理符合本页约定。

## 思考与复盘

1. 哪些信息必须随搜索路径恢复，哪些信息可以在整次搜索中保留？
2. 删除本页提到的一条约束或剪枝，会得到错误答案，还是仅仅变慢？用一个输入说明。
3. 输入达到上限时，时间、递归深度和输出量分别由什么决定？

## 题目来源与课程化说明

来源：[洛谷 P1036 选数](https://www.luogu.com.cn/problem/P1036)。本 Lab 独立编写参考实现和测试数据，并按课程环境重新表述题面；完整参考代码位于 `solution/main.cpp`，不复制第三方题解或隐藏测试。
