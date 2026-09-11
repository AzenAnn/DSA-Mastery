---
title: "Lab 15-E-14：单词搜索"
description: "状态为当前位置、已匹配长度与本条路径使用的格子；成功匹配最后一个字符后返回true。"
order: 14
chapter: 15
labId: "15E14"
chapterTitle: "回溯与搜索"
updated: "2026-09-11"
contributors: ["Azen"]
status: draft
lab: true
difficulty: "进阶"
duration: "60～100 分钟"
---

# Lab 15-E-14：单词搜索

## 学习目标与前置知识

- 明确搜索状态、合法选择与终止条件，完成能通过本地判题的 C++17 解答。
- 用边界输入解释本题的常见错误，说明剪枝或最短距离为何正确。
- 前置：[本章相关知识](../../../../content/chapter-15-backtracking-search/02-classic-problems.md)，C++ 函数、容器、递归，以及题目所用的队列或位运算。

## 题目描述

给定字母网格 board 和单词 word，判断是否能从某个格子出发，沿上下左右相邻格子依次拼出 word。一次拼写中同一个格子不能重复使用；字母区分大小写。

本 Lab 将原题函数接口适配为标准输入/输出。枚举题的读写框架负责按本页约定排序，核心返回值的含义与原题一致。

### 输入格式

第一行 `m n`，随后 m 行各有 n 个连续英文字母，最后一行是 word。

### 输出格式

存在合法路径时输出 `true`，否则输出 `false`。

### 数据范围

`1 <= m,n <= 6`，`1 <= word.length <= 15`；网格与单词只含大小写英文字母。

### 样例输入

```text
3 4
ABCE
SFCS
ADEE
ABCCED
```

### 样例输出

```text
true
```

## 状态与边界

状态为当前位置、已匹配长度与本条路径使用的格子；成功匹配最后一个字符后返回true。

搜索新起点前必须恢复旧分支的字符；相同字母的两个格子可以用，但同一个格子不能反复用。

## 复杂度目标

令L为单词长度，粗略时间上界 O(m*n*4^L)，辅助空间 O(m*n+L)。

## 编写与测试

修改 `student/main.cpp` 中的 `solve`，保留读写框架。标准输出只保留答案，调试信息写入标准错误。测试清单和分值以 `tests/cases.json` 为准，总分 100 分，输入均符合本页约定。

在仓库根目录执行：

```powershell
pnpm lab:run -- labs/chapter-15/exercise/E-15-14-word-search
pnpm lab:score -- labs/chapter-15/exercise/E-15-14-word-search
```

进入本 Lab 目录后也可以运行 `make run`。作者与 CI 严格核验：

```powershell
pnpm lab:verify -- labs/chapter-15/exercise/E-15-14-word-search
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

来源：[力扣 79 单词搜索](https://leetcode.cn/problems/word-search/)。题面按课程环境重新表述，参考实现和测试独立编写，不复制第三方题解或隐藏测试。完整参考代码位于 `solution/main.cpp`。
