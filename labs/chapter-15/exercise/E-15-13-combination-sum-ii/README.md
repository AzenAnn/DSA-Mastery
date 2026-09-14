---
title: "Lab 15-E-13：组合总和 II"
description: "排序后使用start和remaining；下一层从i+1开始，同层相等值跳过。"
order: 13
chapter: 15
labId: "15E13"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "基础"
duration: "35～65 分钟"
---

# Lab 15-E-13：组合总和 II

## 学习目标与前置知识

- 明确搜索状态、合法选择与终止条件，完成能通过本地判题的 C++17 解答。
- 用边界输入解释本题的常见错误，说明剪枝或最短距离为何正确。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/03-pruning.md)，C++ 函数、容器、递归，以及题目所用的队列或位运算。

## 题目描述

给定可能包含重复数值的正整数数组 candidates 和目标 target，找出所有和等于 target 的不同组合。每个输入位置最多使用一次；同值的不同位置可以一起选，但不得输出重复组合。

本 Lab 将原题函数接口适配为标准输入/输出。枚举题的读写框架负责按本页约定排序，核心返回值的含义与原题一致。

### 输入格式

第一行 `n target`，第二行 n 个整数。

### 输出格式

第一行答案数，每个组合一行 `长度 数字...`。内部升序，组合按数值序列字典序，无解输出单个 `0`。

### 数据范围

`1 <= n <= 100`，`1 <= candidates[i] <= 50`，`1 <= target <= 30`。

### 样例输入

```text
7 8
10 1 2 7 6 1 5
```

### 样例输出

```text
4
3 1 1 6
3 1 2 5
2 1 7
2 2 6
```

## 状态与边界

排序后使用start和remaining；下一层从i+1开始，同层相等值跳过。

该题与组合总和的复用规则不同；输入中的两个1可组成[1,1]，同一个位置却不能使用两次。

## 复杂度目标

排序 O(n log n)；枚举上界 O(n * 2^n)，正数和target剪枝大幅缩小搜索；递归辅助空间 O(min(n,target))，另需答案存储。

以上描述核心算法与答案收集的开销。设答案数为 A、单项最大长度为 L，读写框架的字典序整理另需最多 O(A * L * log A) 时间。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留读写框架。标准输出只保留答案，调试信息写入标准错误。测试清单和分值以 `tests/cases.json` 为准，总分 100 分，输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-13-combination-sum-ii
pnpm lab:score -- labs/chapter-15/exercise/E-15-13-combination-sum-ii
```

进入本 Lab 目录后也可以运行 `make run`。作者与 CI 严格核验：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-13-combination-sum-ii
```

## 完成清单

- [ ] 学生程序编译成功，严格评分为 100/100。
- [ ] 能解释搜索状态、终止、撤销或剪枝，以及复杂度。
- [ ] 构造一个能击穿常见错误的最小输入。
- [ ] 答案的数量、顺序和空结果处理符合本页约定。

## 思考与复盘

1. 哪些信息必须随当前路径恢复，哪些信息可以保留？
2. 去掉本题的一条约束或剪枝，会影响正确性还是只影响效率？请用具体输入说明。
3. 输入达到上限时，时间、递归深度和输出大小分别如何增长？

## 题目来源与课程化说明

来源：[力扣 40 组合总和 II](https://leetcode.cn/problems/combination-sum-ii/)。题面按课程环境重新表述，参考实现和测试独立编写，不复制第三方题解或隐藏测试。完整参考代码位于 `solution/main.cpp`。
