---
title: "Lab 15-E-07：奇怪的电梯"
description: "每层楼是一个顶点，每次合法按键是权重为1的有向边；BFS首次发现距离就是最短距离。"
order: 7
chapter: 15
labId: "15E07"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "基础"
duration: "35～65 分钟"
---

# Lab 15-E-07：奇怪的电梯

## 学习目标与前置知识

- 明确本题的搜索状态、合法选择和终止条件，并完成可运行的 C++17 解答。
- 用边界输入解释下面列出的常见错误，确认撤销、去重或最短距离的正确性。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/04-branch-and-bound.md)，以及 C++ 函数、数组/容器和递归；BFS 题还需要队列。

## 题目描述

电梯所在建筑有 N 层。在第 i 层按一次按钮，只能到第 i+K[i] 层或第 i-K[i] 层，超出 1 到 N 的移动不可执行。求从 A 层到 B 层至少需要按几次按钮。

本 Lab 保留原题的标准输入/输出合同。

### 输入格式

第一行 `N A B`，第二行 N 个整数 `K[i]`，楼层从 1 开始。

### 输出格式

输出最少按键次数，不可达输出 `-1`。若 A=B，输出 `0`。

### 数据范围

`1 <= N <= 200`，`1 <= A,B <= N`，`0 <= K[i] <= N`。

### 样例输入

```text
5 1 5
3 3 1 2 5
```

### 样例输出

```text
3
```

## 状态与边界

每层楼是一个顶点，每次合法按键是权重为1的有向边；BFS首次发现距离就是最短距离。

使用当前楼层的K值；入队时标记已访问，尤其要避免K=0导致重复入队。

## 复杂度目标

时间 O(N)，辅助空间 O(N)。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留现有读写框架。调试信息写入标准错误，标准输出只保留答案。测试清单和分值以 `tests/cases.json` 为准，总分 100 分；输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-07-strange-elevator
pnpm lab:score -- labs/chapter-15/exercise/E-15-07-strange-elevator
```

进入本 Lab 目录后也可运行 `make run`。作者核验命令为：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-07-strange-elevator
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

来源：[洛谷 P1135 奇怪的电梯](https://www.luogu.com.cn/problem/P1135)。本 Lab 独立编写参考实现和测试数据，并按课程环境重新表述题面；完整参考代码位于 `solution/main.cpp`，不复制第三方题解或隐藏测试。
