---
title: "Lab 13-E-15：最低加油次数"
description: "在燃料不足时从已过站点选择最大油量，最少化补给次数。"
order: 15
chapter: 13
labId: "13E15"
chapterTitle: "贪心算法"
updated: "2026-09-11"
contributors: ["Shuoyuchen"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "75～90 分钟"
---

# Lab 13-E-15：最低加油次数

## 学习目标

- 将本题的局部选择写成可执行的不变量。
- 用边界与反例检验贪心选择是否安全。
- 完成 C++17 标准输入输出程序并通过公开评分。

## 前置知识

- 数组、排序或顺序扫描。
- 贪心选择性质与交换论证。
- C++17 的标准输入输出。

## 问题描述

从 0 出发前往 target，经过按位置升序排列的加油站。每次可选择加完某已过站点的全部燃料，求最少次数，不能到达则输出 -1。

## 输入格式

第一行是 `target startFuel n`；随后每行是一个 `position fuel`。

## 输出格式

输出最少加油次数，不能到达输出 `-1`。

## 约束

`target` 与燃料量不超过 `10^9`，`0 ≤ n ≤ 500`，站点位置递增。

## 示例

输入：

```text
100 10 4
10 60
20 30
30 30
60 40
```

输出：

```text
2
```

## 思路提示

先把经过站点的油量放入最大堆；只有抵达下一位置的燃料不足时才取出最大油量。

## 复杂度分析

时间 `O(n log n)`，额外空间 `O(n)`。

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
pnpm lab:run -- labs/chapter-13/exercise/E-13-15-minimum-number-of-refueling-stops --target student
pnpm lab:verify -- labs/chapter-13/exercise/E-13-15-minimum-number-of-refueling-stops --no-color
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

本题对应 LeetCode：<https://leetcode.com/problems/minimum-number-of-refueling-stops/>。本 Lab 将函数式参数改写为标准输入输出格式。
