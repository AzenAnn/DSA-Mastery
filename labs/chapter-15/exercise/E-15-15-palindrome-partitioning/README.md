---
title: "Lab 15-E-15：分割回文串"
description: "start表示未切分后缀起点；每次选择一个以start开头的回文片段，再处理剩余后缀。"
order: 15
chapter: 15
labId: "15E15"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "进阶"
duration: "60～100 分钟"
---

# Lab 15-E-15：分割回文串

## 学习目标与前置知识

- 明确搜索状态、合法选择与终止条件，完成能通过本地判题的 C++17 解答。
- 用边界输入解释本题的常见错误，说明剪枝或最短距离为何正确。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/02-classic-problems.md)，C++ 函数、容器、递归，以及题目所用的队列或位运算。

## 题目描述

将非空字符串 s 分割成若干个非空连续子串，使每个子串都是回文。回文指正着读和倒着读相同。返回所有不同的分割方案，每种方案拼接后必须恰好还原 s。

本 Lab 将原题函数接口适配为标准输入/输出。枚举题的读写框架负责按本页约定排序，核心返回值的含义与原题一致。

### 输入格式

一行小写字母字符串 s。

### 输出格式

第一行方案数量，其后每行先输出片段数，再按原位置输出各子串，空格分隔。方案按子串序列字典序排序，较短的共同前缀在前。

### 数据范围

`1 <= s.length <= 16`，仅小写英文字母。

### 样例输入

```text
aab
```

### 样例输出

```text
2
3 a a b
2 aa b
```

## 状态与边界

start表示未切分后缀起点；每次选择一个以start开头的回文片段，再处理剩余后缀。

不能打乱片段顺序；到达字符串末尾才收集整套方案。长度1的子串始终是回文。

## 复杂度目标

预处理 O(n^2)，枚举与复制答案最坏 O(n * 2^n)；辅助空间 O(n^2)，答案存储最坏 O(n * 2^n)。

以上描述核心算法与答案收集的开销。设答案数为 A、单项最大长度为 L，读写框架的字典序整理另需最多 O(A * L * log A) 时间。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留读写框架。标准输出只保留答案，调试信息写入标准错误。测试清单和分值以 `tests/cases.json` 为准，总分 100 分，输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-15-palindrome-partitioning
pnpm lab:score -- labs/chapter-15/exercise/E-15-15-palindrome-partitioning
```

进入本 Lab 目录后也可以运行 `make run`。作者与 CI 严格核验：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-15-palindrome-partitioning
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

来源：[力扣 131 分割回文串](https://leetcode.cn/problems/palindrome-partitioning/)。题面按课程环境重新表述，参考实现和测试独立编写，不复制第三方题解或隐藏测试。完整参考代码位于 `solution/main.cpp`。
