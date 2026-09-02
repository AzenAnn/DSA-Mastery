---
title: "Lab 12-03：逆序对计数（归并分治）"
description: "用归并分治统计逆序对个数，理解分治统计与合并过程。"
order: 3
chapter: 12
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["DSA Mastery Team"]
status: "draft"
difficulty: "进阶"
duration: "35～50 分钟"
lab: true
---

# Lab 12-03：逆序对计数（归并分治）

## 题目

给定长度为 `n` 的整数序列，逆序对定义为 `(i, j)`，满足 `i < j` 且 `a[i] > a[j]`。
请输出数组中的逆序对总数。

## 输入格式

- 第一行整数 `n`；
- 第二行 `n` 个整数。

## 输出格式

一个整数，表示逆序对总数。

## 示例

### 输入

```input
5
2 4 1 3 5
```

### 输出

```output
3
```

## 约束

- `1 ≤ n ≤ 2*10^5`
- 值域为 `[-10^9, 10^9]`
- 要求使用 O(n log n) 思路；使用归并统计时输出结果用 64 位。

## 评分建议

- 0～20 分：能处理空数组和 n=1；  
- 21～60 分：分治结构正确；  
- 61～100 分：结果正确、格式一致、无溢出。

## 验证命令

```powershell
make doctor
make run
make run CASE=001-sample
make score
```
