---
title: "Lab 15-E-02：组合的输出"
description: "`start` 是下一次允许选择的最小数字；路径严格递增。"
order: 2
chapter: 15
labId: "15E02"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "入门"
duration: "35～65 分钟"
---

# Lab 15-E-02：组合的输出

## 学习目标与前置知识

- 明确本题的搜索状态、合法选择和终止条件，并完成可运行的 C++17 解答。
- 用边界输入解释下面列出的常见错误，确认撤销、去重或最短距离的正确性。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/01-backtracking-framework.md)，以及 C++ 函数、数组/容器和递归；BFS 题还需要队列。

## 题目描述

从 1 到 n 中选择 r 个不同整数，输出全部组合。每个组合内部按升序排列，组合之间按字典序排列。同一组数字的不同排列只算一个组合。

本 Lab 保留原题的标准输入/输出合同。

### 输入格式

一行两个整数 `n r`。

### 输出格式

每行一个组合，每个数占 3 个字符宽度并右对齐。`r=0` 时恰有一个空组合，输出一个空行。本地 tokens 比较忽略空白，因此不能单靠该空用例区分空行和没有输出。

### 数据范围

`2 <= n <= 20`，`0 <= r <= n`。

### 样例输入

```text
4 2
```

### 样例输出

```text
  1  2
  1  3
  1  4
  2  3
  2  4
  3  4
```

## 状态与边界

`start` 是下一次允许选择的最小数字；路径严格递增。

下一层从 value+1 开始，不从 1 重新选择；r=0 在根结点就已形成答案。

## 复杂度目标

时间 O((r+1) * C(n,r))，辅助空间 O(r)。流式输出。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留现有读写框架。调试信息写入标准错误，标准输出只保留答案。测试清单和分值以 `tests/cases.json` 为准，总分 100 分；输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-02-combinations
pnpm lab:score -- labs/chapter-15/exercise/E-15-02-combinations
```

进入本 Lab 目录后也可运行 `make run`。作者核验命令为：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-02-combinations
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

来源：[洛谷 P1157 组合的输出](https://www.luogu.com.cn/problem/P1157)。本 Lab 独立编写参考实现和测试数据，并按课程环境重新表述题面；完整参考代码位于 `solution/main.cpp`，不复制第三方题解或隐藏测试。
