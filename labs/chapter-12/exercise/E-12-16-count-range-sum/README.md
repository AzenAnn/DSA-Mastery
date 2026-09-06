---
title: "Lab 12-E-16：Count of Range Sum"
description: "把区间和转化为前缀和差值，并在归并层用两个滑动边界计数。"
order: 16
chapter: 12
labId: "12E16"
chapterTitle: "分治与递归"
updated: "2026-09-04"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "80～110 分钟"
---

# Lab 12-E-16：Count of Range Sum

## 学习目标

- [ ] 能写清递归函数的输入、返回值、边界条件与规模递减方式。
- [ ] 能识别本题的拆分与合并阶段，并独立完成 C++17 实现。
- [ ] 能用边界或反例解释「前缀和数组必须包含初始 0，否则会漏掉从下标 0 开始的子数组。」。

## 前置知识与环境

先阅读 [第 12 章对应小节](../../../../content/chapter-12-divide-conquer-recursion/04-combine-patterns.md)，并确保本机可使用 C++17。首次运行可执行 `make doctor`；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

## 题目

给定整数数组与 `lower≤upper`，统计区间和落在闭区间 `[lower,upper]` 内的连续子数组数量。

### 输入格式

第一行 `n lower upper`，第二行 n 个 32 位整数。

### 输出格式

输出合法连续子数组数量。

### 数据范围

`1 ≤ n ≤ 10^5`，`-10^5 ≤ lower≤upper ≤10^5`。

### 样例输入

```text
3 -2 2
-2 5 -1
```

### 样例输出

```text
3
```

## 递归契约卡

| 问题 | 本题答案 |
| --- | --- |
| 子问题契约 | `count(prefix,left,right)` 统计前缀和下标区间中的合法有序对，并在返回时将其排序。 |
| Divide | 把前缀和数组按下标分成左右两半，递归统计内部区间。 |
| Conquer | 对规模严格更小的子问题递归求解；达到最小规模时直接返回。 |
| Combine | 对每个左前缀和，在有序右半中维护差值落入 `[lower,upper]` 的两个边界，再归并。 |
| 终止性检查 | 每次递归都缩短区间、减小规模或把下标映射到更短的一层。 |

::: pitfall 易错点
前缀和数组必须包含初始 0，否则会漏掉从下标 0 开始的子数组。
:::

## 复杂度目标

时间 `O(n log n)`，空间 `O(n)`；前缀和与答案使用 64 位。

## 测试设计提示

公开测试共 20 组、每组 5 分，总分 100 分。它们覆盖样例、最小规模、边界值、重复值、负数或极值、典型回归输入和适度压力数据。测试只读取标准输出；调试信息请写到标准错误。

## 运行与评分

```powershell
cd labs/chapter-12/exercise/E-12-16-count-range-sum
make run

# 没有 Make 时，在仓库根执行
pnpm lab:run -- labs/chapter-12/exercise/E-12-16-count-range-sum

# 作者与 CI 的严格检查
pnpm lab:verify -- labs/chapter-12/exercise/E-12-16-count-range-sum
```

## 完成清单

- [ ] `student/main.cpp` 已替换占位逻辑，并能通过编译。
- [ ] 20 个公开测试全部通过，严格评分为 100/100。
- [ ] 能口头说明递归契约、基本情况、规模递减与合并不变量。
- [ ] 主动构造了至少一个会击穿常见错误的额外输入。

## 思考与复盘

1. 如果把子问题契约改成另一种区间语义，边界和合并会怎样变化？
2. 哪个最小反例最容易暴露「前缀和数组必须包含初始 0，否则会漏掉从下标 0 开始的子数组。」？
3. 递归调用栈保存了哪些信息？能否安全改写成迭代？

## 题目来源与课程化说明

核心问题参考 [LeetCode 327](https://leetcode.cn/problems/count-of-range-sum/)。本 Lab 为统一的标准输入/输出环境重新表述题面，并独立编写参考实现与测试数据；不复制第三方题解、代码或隐藏测试。若本地输出合同与原平台不同，以上“输出格式”和“递归契约卡”是本 Lab 的判定依据。
