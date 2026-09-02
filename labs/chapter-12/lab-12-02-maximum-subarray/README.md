---
title: "Lab 12-02：最大子数组和（分治）"
description: "用分治递归计算最大连续子数组和，训练复杂度分析与分治边界处理。"
order: 2
chapter: 12
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["DSA Mastery Team"]
status: "draft"
difficulty: "进阶"
duration: "35～50 分钟"
lab: true
---

# Lab 12-02：最大子数组和（分治）

## 题目

给定长度为 `n` 的整数序列，求其最大连续子数组和。

要求使用分治思想实现，输出单个整数，即最大子数组和。  
当 `n = 0` 时输出 `0`。

## 输入格式

- 第一行整数 `n`；
- 第二行 `n` 个整数，范围 `[-10^9, 10^9]`。

## 输出格式

一个整数，表示最大连续子数组和。

## 示例

### 输入

```input
9
-2 1 -3 4 -1 2 1 -5 4
```

### 输出

```output
6
```

## 约束与评分

- `1 ≤ n ≤ 10^5`（建议使用 O(n log n) 的分治实现）；
- 时间复杂度要求：`O(n log n)`；
- 额外空间：`O(log n)`（递归栈）或 `O(n)`（实现细节差异在 `O(log n)` 附近可接受）。

## 验证命令

```powershell
make doctor
make run
make run CASE=001-sample
make score
```

未装 `make` 时使用：

```powershell
pnpm lab:doctor -- labs/chapter-12/lab-12-02-maximum-subarray
pnpm lab:run -- labs/chapter-12/lab-12-02-maximum-subarray
pnpm lab:score -- labs/chapter-12/lab-12-02-maximum-subarray
```

标准输出必须无多余空格，样例为课程学习的严格校验点。
