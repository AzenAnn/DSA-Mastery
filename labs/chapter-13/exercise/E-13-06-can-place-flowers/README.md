---
title: "Lab 13-E-06：种花问题"
description: "扫描花坛空位，练习局部可行的即时种植贪心。"
order: 6
chapter: 13
labId: "13E06"
chapterTitle: "贪心算法"
updated: "2026-09-11"
contributors: ["Shuoyuchen"]
status: "draft"
lab: true
difficulty: "入门"
duration: "30～45 分钟"
---

# Lab 13-E-06：种花问题

## 学习目标

- 将本题的局部选择写成可执行的不变量。
- 用边界与反例检验贪心选择是否安全。
- 完成 C++17 标准输入输出程序并通过公开评分。

## 前置知识

- 数组、排序或顺序扫描。
- 贪心选择性质与交换论证。
- C++17 的标准输入输出。

## 问题描述

给定不含相邻已种花的花坛，判断还能否种下至少指定数量的新花，且任意两朵花不能相邻。

## 输入格式

第一行是 `n need`；第二行是 `n` 个 0/1，表示花坛。

## 输出格式

输出 `true` 或 `false`。

## 约束

`1 ≤ n ≤ 20000`，`0 ≤ need ≤ n`，已有花不相邻。

## 示例

输入：

```text
5 1
1 0 0 0 1
```

输出：

```text
true
```

## 思路提示

从左到右扫描；当前位置和两侧都为空时立即种下，并把它视为已占用。

## 复杂度分析

时间 `O(n)`，额外空间 `O(1)`（可原地标记）。

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
pnpm lab:run -- labs/chapter-13/exercise/E-13-06-can-place-flowers --target student
pnpm lab:verify -- labs/chapter-13/exercise/E-13-06-can-place-flowers --no-color
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

本题对应 LeetCode：<https://leetcode.com/problems/can-place-flowers/description/>。本 Lab 将函数式参数改写为标准输入输出格式。
