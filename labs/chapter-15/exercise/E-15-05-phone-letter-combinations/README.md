---
title: "Lab 15-E-05：电话号码的字母组合"
description: "递归深度表示正在处理第几个数字；每层只从这个数字的字母表中选择。"
order: 5
chapter: 15
labId: "15E05"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "入门"
duration: "35～65 分钟"
---

# Lab 15-E-05：电话号码的字母组合

## 学习目标与前置知识

- 明确本题的搜索状态、合法选择和终止条件，并完成可运行的 C++17 解答。
- 用边界输入解释下面列出的常见错误，确认撤销、去重或最短距离的正确性。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/01-backtracking-framework.md)，以及 C++ 函数、数组/容器和递归；BFS 题还需要队列。

## 题目描述

给定只包含数字 2 到 9 的字符串 digits，每个数字选择一个对应字母，返回所有可能的字母串。映射为 2:abc，3:def，4:ghi，5:jkl，6:mno，7:pqrs，8:tuv，9:wxyz。

原题采用函数接口并允许题面规定范围内的结果顺序；本 Lab 使用下面的标准输入/输出约定。读写框架负责输出排序，核心返回值的含义与原题一致。

### 输入格式

一行非空数字字符串 `digits`。

### 输出格式

第一行输出组合数量，其后每行一个组合，按字符串字典序排列。

### 数据范围

`1 <= digits.length <= 4`，字符仅为 `2` 到 `9`。按当前官方范围，不包含空字符串。

### 样例输入

```text
23
```

### 样例输出

```text
9
ad
ae
af
bd
be
bf
cd
ce
cf
```

## 状态与边界

递归深度表示正在处理第几个数字；每层只从这个数字的字母表中选择。

7 和 9 有四个字母，不是所有数字都对应三个字母。

## 复杂度目标

长度为L，时间 O(L * 4^L)，递归辅助空间 O(L)，返回结果占 O(L * 4^L)。

以上描述核心算法与答案收集的开销。设答案数为 A、单项最大长度为 L，读写框架的字典序整理另需最多 O(A * L * log A) 时间。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留现有读写框架。调试信息写入标准错误，标准输出只保留答案。测试清单和分值以 `tests/cases.json` 为准，总分 100 分；输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-05-phone-letter-combinations
pnpm lab:score -- labs/chapter-15/exercise/E-15-05-phone-letter-combinations
```

进入本 Lab 目录后也可运行 `make run`。作者核验命令为：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-05-phone-letter-combinations
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

来源：[力扣 17 电话号码的字母组合](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/)。本 Lab 独立编写参考实现和测试数据，并按课程环境重新表述题面；完整参考代码位于 `solution/main.cpp`，不复制第三方题解或隐藏测试。
