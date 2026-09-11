---
title: "Lab 15-E-09：括号生成"
description: "状态为已经使用的左括号数 left 和右括号数 right；始终保持 0 <= right <= left <= n。"
order: 9
chapter: 15
labId: "15E09"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "基础"
duration: "35～65 分钟"
---

# Lab 15-E-09：括号生成

## 学习目标与前置知识

- 明确搜索状态、合法选择与终止条件，完成能通过本地判题的 C++17 解答。
- 用边界输入解释本题的常见错误，说明剪枝或最短距离为何正确。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/03-pruning.md)，C++ 函数、容器、递归，以及题目所用的队列或位运算。

## 题目描述

给定正整数 n，生成所有由 n 对圆括号组成的有效括号字符串。有效意味着每个前缀中右括号数量不超过左括号数量，整串左右括号数量相等。

本 Lab 将原题函数接口适配为标准输入/输出。枚举题的读写框架负责按本页约定排序，核心返回值的含义与原题一致。

### 输入格式

一行整数 `n`。

### 输出格式

第一行输出字符串数量，其后每行一个有效括号串，按字典序排列。

### 数据范围

`1 <= n <= 8`。

### 样例输入

```text
3
```

### 样例输出

```text
5
((()))
(()())
(())()
()(())
()()()
```

## 状态与边界

状态为已经使用的左括号数 left 和右括号数 right；始终保持 0 <= right <= left <= n。

只检查整串左右括号总数相同是不够的，前缀也必须合法。

## 复杂度目标

答案数为第n个Catalan数 Cn，时间 O(n * Cn)，递归辅助空间 O(n)，答案存储 O(n * Cn)。

以上描述核心算法与答案收集的开销。设答案数为 A、单项最大长度为 L，读写框架的字典序整理另需最多 O(A * L * log A) 时间。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留读写框架。标准输出只保留答案，调试信息写入标准错误。测试清单和分值以 `tests/cases.json` 为准，总分 100 分，输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-09-generate-parentheses
pnpm lab:score -- labs/chapter-15/exercise/E-15-09-generate-parentheses
```

进入本 Lab 目录后也可以运行 `make run`。作者与 CI 严格核验：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-09-generate-parentheses
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

来源：[力扣 22 括号生成](https://leetcode.cn/problems/generate-parentheses/)。题面按课程环境重新表述，参考实现和测试独立编写，不复制第三方题解或隐藏测试。完整参考代码位于 `solution/main.cpp`。
