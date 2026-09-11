---
title: "Lab 13-E-10：卡车上的最大单元数"
description: "按单位价值排序，在容量限制下完成贪心装载。"
order: 10
chapter: 13
labId: "13E10"
chapterTitle: "贪心算法"
updated: "2026-09-11"
contributors: ["Shuoyuchen"]
status: "draft"
lab: true
difficulty: "入门"
duration: "30～45 分钟"
---

# Lab 13-E-10：卡车上的最大单元数

## 学习目标

- 将本题的局部选择写成可执行的不变量。
- 用边界与反例检验贪心选择是否安全。
- 完成 C++17 标准输入输出程序并通过公开评分。

## 前置知识

- 数组、排序或顺序扫描。
- 贪心选择性质与交换论证。
- C++17 的标准输入输出。

## 问题描述

每种箱子给出数量和每箱单元数，卡车容量有限。求能装下的最大单元总数。

## 输入格式

第一行是 `typeCount truckSize`；随后每行是 `boxCount unitsPerBox`。

## 输出格式

输出最大单元数。

## 约束

`1 ≤ typeCount ≤ 1000`，箱数和单元数不超过 1000。

## 示例

输入：

```text
3 4
1 3
2 2
3 1
```

输出：

```text
8
```

## 思路提示

一箱占用相同容量，因此始终优先装每箱单元数更多的类型。

## 复杂度分析

时间 `O(t log t)`，其中 `t` 是箱型数；额外空间 `O(t)`。

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
pnpm lab:run -- labs/chapter-13/exercise/E-13-10-maximum-units-on-a-truck --target student
pnpm lab:verify -- labs/chapter-13/exercise/E-13-10-maximum-units-on-a-truck --no-color
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

本题对应 LeetCode：<https://leetcode.com/problems/maximum-units-on-a-truck/>。本 Lab 将函数式参数改写为标准输入输出格式。
