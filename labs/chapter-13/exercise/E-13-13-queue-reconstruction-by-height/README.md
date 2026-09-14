---
title: "Lab 13-E-13：根据身高重建队列"
description: "按身高排序后按 k 插入，恢复满足可见人数约束的队列。"
order: 13
chapter: 13
labId: "13E13"
chapterTitle: "贪心算法"
updated: "2026-09-11"
contributors: ["Shuoyuchen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～75 分钟"
---

# Lab 13-E-13：根据身高重建队列

## 学习目标

- 将本题的局部选择写成可执行的不变量。
- 用边界与反例检验贪心选择是否安全。
- 完成 C++17 标准输入输出程序并通过公开评分。

## 前置知识

- 数组、排序或顺序扫描。
- 贪心选择性质与交换论证。
- C++17 的标准输入输出。

## 问题描述

每人以 `[height, k]` 表示：前方恰有 `k` 个身高不低于他的人。重建队列。

## 输入格式

第一行是人数 `n`；随后每行一个 `height k`。

## 输出格式

输出 `n` 行重建后的 `height k`。

## 约束

`1 ≤ n ≤ 2000`，输入保证可构成有效队列。

## 示例

输入：

```text
6
7 0
4 4
7 1
5 0
6 1
5 2
```

输出：

```text
5 0
7 0
5 2
6 1
4 4
7 1
```

## 思路提示

先处理较高的人：他们插入到下标 k 后，不会改变较矮者对“更高或相等”的计数。

## 复杂度分析

排序为 `O(n log n)`，向量插入使总时间 `O(n²)`，额外空间 `O(n)`。

## 测试设计提示

公开测试共 20 组，每组 5 分，总分 100 分。测试覆盖题面样例、最小输入、退化或反例场景、贪心选择边界与符合题目约束的压力数据。

## 运行与评分

在本 Lab 目录执行：

```bash
make doctor
make run
make score
```

也可以在仓库根目录执行：

```bash
pnpm lab:run -- labs/chapter-13/exercise/E-13-13-queue-reconstruction-by-height --target student
pnpm lab:verify -- labs/chapter-13/exercise/E-13-13-queue-reconstruction-by-height --no-color
```

## 完成清单

- [ ] 完整读取题目规定的输入。
- [ ] 按题意实现贪心选择，并说明它为何安全。
- [ ] 覆盖正常、边界与反例输入。
- [ ] 20 个公开测试全部通过，严格评分为 100/100。

## 思考与复盘

1. 当前局部选择为什么不会排除最优解？
2. 哪一组公开测试最容易暴露一个看似合理但错误的选择？
3. 如果题目约束改变，当前策略还成立吗？

## 题目来源

本题对应 LeetCode：<https://leetcode.com/problems/queue-reconstruction-by-height/>。本 Lab 将函数式参数改写为标准输入输出格式。
