---
title: "Lab 15-E-10：组合总和"
description: "`start` 控制后续候选起点，`remaining` 是还需凑出的和；选中i后下一层仍可从i开始。"
order: 10
chapter: 15
labId: "15E10"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "基础"
duration: "35～65 分钟"
---

# Lab 15-E-10：组合总和

## 学习目标与前置知识

- 明确搜索状态、合法选择与终止条件，完成能通过本地判题的 C++17 解答。
- 用边界输入解释本题的常见错误，说明剪枝或最短距离为何正确。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/02-classic-problems.md)，C++ 函数、容器、递归，以及题目所用的队列或位运算。

## 题目描述

给定互不相同的正整数 candidates 和目标 target，找出所有元素和等于 target 的组合。每个候选数字可以使用任意多次；只要各数字的使用次数相同，就视为同一个组合。

本 Lab 将原题函数接口适配为标准输入/输出。枚举题的读写框架负责按本页约定排序，核心返回值的含义与原题一致。

### 输入格式

第一行 `n target`，第二行 n 个候选整数。

### 输出格式

第一行答案数，其后每行 `组合长度 数字...`。组合内部升序，组合间按数值序列字典序排列；无解输出单个 `0`。

### 数据范围

`1 <= n <= 30`，`2 <= candidates[i] <= 40`，候选互异，`1 <= target <= 40`；官方保证答案数严格少于150。

### 样例输入

```text
4 7
2 3 6 7
```

### 样例输出

```text
2
3 2 2 3
1 7
```

## 状态与边界

`start` 控制后续候选起点，`remaining` 是还需凑出的和；选中i后下一层仍可从i开始。

下一层从i+1开始会错成每个数只能用一次；从0开始则会把同一组合的排列重复计数。

## 复杂度目标

令L=floor(target/min(candidates))，粗略上界为 O(n^L * L)，剪枝后取决于可行前缀数；递归辅助空间 O(L)，另需存储答案。

以上描述核心算法与答案收集的开销。设答案数为 A、单项最大长度为 L，读写框架的字典序整理另需最多 O(A * L * log A) 时间。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留读写框架。标准输出只保留答案，调试信息写入标准错误。测试清单和分值以 `tests/cases.json` 为准，总分 100 分，输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-10-combination-sum
pnpm lab:score -- labs/chapter-15/exercise/E-15-10-combination-sum
```

进入本 Lab 目录后也可以运行 `make run`。作者与 CI 严格核验：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-10-combination-sum
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

来源：[力扣 39 组合总和](https://leetcode.cn/problems/combination-sum/)。题面按课程环境重新表述，参考实现和测试独立编写，不复制第三方题解或隐藏测试。完整参考代码位于 `solution/main.cpp`。
