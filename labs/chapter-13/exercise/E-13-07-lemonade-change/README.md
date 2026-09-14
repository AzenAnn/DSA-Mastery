---
title: "Lab 13-E-07：柠檬水找零"
description: "维护零钱面额计数，理解“保留更灵活资源”的贪心选择。"
order: 7
chapter: 13
labId: "13E07"
chapterTitle: "贪心算法"
updated: "2026-09-11"
contributors: ["Shuoyuchen"]
status: "draft"
lab: true
difficulty: "入门"
duration: "30～45 分钟"
---

# Lab 13-E-07：柠檬水找零

## 学习目标

- 将本题的局部选择写成可执行的不变量。
- 用边界与反例检验贪心选择是否安全。
- 完成 C++17 标准输入输出程序并通过公开评分。

## 前置知识

- 数组、排序或顺序扫描。
- 贪心选择性质与交换论证。
- C++17 的标准输入输出。

## 问题描述

每杯柠檬水售价 5 元，顾客依次支付 5、10 或 20 元。判断能否始终正确找零。

## 输入格式

第一行是顾客数 `n`；第二行是 `n` 个支付面额。

## 输出格式

输出 `true` 或 `false`。

## 约束

`1 ≤ n ≤ 100000`；面额只可能为 5、10、20。

## 示例

输入：

```text
5
5 5 5 10 20
```

输出：

```text
true
```

## 思路提示

只记录 5 元与 10 元的张数。收到 20 元时，优先找 10+5，以保留更多 5 元。

## 复杂度分析

时间 `O(n)`，额外空间 `O(1)`。

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
pnpm lab:run -- labs/chapter-13/exercise/E-13-07-lemonade-change --target student
pnpm lab:verify -- labs/chapter-13/exercise/E-13-07-lemonade-change --no-color
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

本题对应 LeetCode：<https://leetcode.com/problems/lemonade-change/description/>。本 Lab 将函数式参数改写为标准输入输出格式。
