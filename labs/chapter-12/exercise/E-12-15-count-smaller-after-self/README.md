---
title: "Lab 12-E-15：Count of Smaller Numbers After Self"
description: "归并原下标而不是数值本身，为每个元素累计右侧更小元素数。"
order: 15
chapter: 12
labId: "12E15"
chapterTitle: "分治与递归"
updated: "2026-09-04"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "75～100 分钟"
---

# Lab 12-E-15：Count of Smaller Numbers After Self

## 学习目标

- [ ] 能写清递归函数的输入、返回值、边界条件与规模递减方式。
- [ ] 能识别本题的拆分与合并阶段，并独立完成 C++17 实现。
- [ ] 能用边界或反例解释「相等值不算更小；比较相等时应先取左侧，避免误计。」。

## 前置知识与环境

先阅读 [第 12 章对应小节](../../../../content/chapter-12-divide-conquer-recursion/04-combine-patterns.md)，并确保本机可使用 C++17。首次运行可执行 `make doctor`；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

## 题目

对数组中每个位置 i，计算其右侧严格小于 `a[i]` 的元素个数。

### 输入格式

第一行 `n`，第二行 n 个整数。

### 输出格式

输出 n 个计数，按原数组顺序排列。

### 数据范围

`1 ≤ n ≤ 10^5`，`-10^4 ≤ a[i] ≤ 10^4`。

### 样例输入

```text
4
5 2 6 1
```

### 样例输出

```text
2 1 1 0
```

## 递归契约卡

| 问题 | 本题答案 |
| --- | --- |
| 子问题契约 | `sortIndices(left,right)` 返回按数值稳定排序的原下标区间，并把跨区间贡献累加到答案。 |
| Divide | 按原位置把下标数组分成左右两半。 |
| Conquer | 对规模严格更小的子问题递归求解；达到最小规模时直接返回。 |
| Combine | 合并时记录已经先取出的右半较小元素数量，并加到每个左半元素。 |
| 终止性检查 | 每次递归都缩短区间、减小规模或把下标映射到更短的一层。 |

::: pitfall 易错点
相等值不算更小；比较相等时应先取左侧，避免误计。
:::

## 复杂度目标

时间 `O(n log n)`，空间 `O(n)`。

## 测试设计提示

公开测试共 20 组、每组 5 分，总分 100 分。它们覆盖样例、最小规模、边界值、重复值、负数或极值、典型回归输入和适度压力数据。测试只读取标准输出；调试信息请写到标准错误。

## 运行与评分

```powershell
cd labs/chapter-12/exercise/E-12-15-count-smaller-after-self
make run

# 没有 Make 时，在仓库根执行
pnpm lab:run -- labs/chapter-12/exercise/E-12-15-count-smaller-after-self

# 作者与 CI 的严格检查
pnpm lab:verify -- labs/chapter-12/exercise/E-12-15-count-smaller-after-self
```

## 完成清单

- [ ] `student/main.cpp` 已替换占位逻辑，并能通过编译。
- [ ] 20 个公开测试全部通过，严格评分为 100/100。
- [ ] 能口头说明递归契约、基本情况、规模递减与合并不变量。
- [ ] 主动构造了至少一个会击穿常见错误的额外输入。

## 思考与复盘

1. 如果把子问题契约改成另一种区间语义，边界和合并会怎样变化？
2. 哪个最小反例最容易暴露「相等值不算更小；比较相等时应先取左侧，避免误计。」？
3. 递归调用栈保存了哪些信息？能否安全改写成迭代？

## 题目来源与课程化说明

核心问题参考 [LeetCode 315](https://leetcode.cn/problems/count-of-smaller-numbers-after-self/)。本 Lab 为统一的标准输入/输出环境重新表述题面，并独立编写参考实现与测试数据；不复制第三方题解、代码或隐藏测试。若本地输出合同与原平台不同，以上“输出格式”和“递归契约卡”是本 Lab 的判定依据。
