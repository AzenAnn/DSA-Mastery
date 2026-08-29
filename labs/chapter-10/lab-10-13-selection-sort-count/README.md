---
title: "Lab 10-13：选择排序与交换次数"
description: "在选择排序中统计交换次数，输出排序结果和交换次数。"
order: 13
chapter: 10
chapterTitle: "排序"
updated: "2026-08-29"
contributors: ["fjll-27"]
status: "draft"
lab: true
difficulty: "基础"
duration: "25～35 分钟"
---

# Lab 10-13：选择排序与交换次数

难度：基础。题目原型为 AOJ [ALDS1_2_B Selection Sort](https://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ALDS1_2_B)。本题在**选择排序模板**的基础上多统计一步：每轮真正发生的交换次数。

## 目标

完成本题后，你应该能够：

- 在已掌握的选择排序循环里加入交换计数；
- 说清「只有 `minj != i` 时才算一次交换」的原因；
- 观察不同输入（有序、逆序、重复）下交换次数的变化规律。

## 前置知识

- 10.2 选择排序的完整实现；
- `if` 条件与整型计数器。

## 题目

读入 `n` 和 `n` 个整数，用选择排序将它们从小到大排序。输出排序后的数组（一行）和排序过程中发生的交换次数（一行）。

### 输入格式

- 第一行一个整数 `n`；
- 第二行 `n` 个整数，空格分隔。

### 输出格式

- 第一行 `n` 个整数，空格分隔，表示排序后的数组；
- 第二行一个整数，表示交换次数。

## 数据范围

| 项目 | 范围 |
| --- | --- |
| 数组长度 `n` | 1 ≤ n ≤ 100 |
| 元素值 | 0 ≤ a[i] ≤ 100 |

## 样例

### 样例输入

```input
6
5 6 4 2 1 3
```

### 样例输出

```output
1 2 3 4 5 6
4
```

### 样例解释

选择排序过程共发生 4 次交换：`5↔1`、`6↔2`、`4↔3`、`6↔4`（最后一轮最小值已在当前位置，不交换）。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用等价的 pnpm 入口：

```powershell
pnpm lab:run -- labs/chapter-10/lab-10-13-selection-sort-count
pnpm lab:score -- labs/chapter-10/lab-10-13-selection-sort-count
```

标准输出参与判题，调试信息请写入标准错误。

## 完成清单

- [ ] 样例输出与题目一致
- [ ] 升序（0 次）、逆序、含重复值三种情况都通过
- [ ] 能说出为什么已有序时交换次数为 0

## 思考题

1. 选择排序每轮至多交换一次，那么最坏情况下最多交换多少次？
2. 如果数组所有元素都相等，交换次数是多少？为什么？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

在选择排序的外层循环里，每轮先扫描 `[i, n-1]` 找到最小值下标 `minj`：

- 若 `minj == i`，说明最小值本来就在当前位置，不需要交换；
- 若 `minj != i`，交换 `a[i]` 与 `a[minj]`，交换次数加 1。

因为每轮最多交换一次，所以总交换次数不超过 `n - 1`。

### 复杂度分析

- 时间复杂度：`O(n²)`；
- 空间复杂度：`O(1)` 额外空间。

</details>
