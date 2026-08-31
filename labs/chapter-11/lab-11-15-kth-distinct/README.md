---
title: "Lab 11-15：第 k 小整数（去重）"
description: "排序后去重，再取第 k 小的整数，练习 unique 与不足 k 个时的边界处理。"
order: 15
chapter: 11
labId: "11E09"
chapterTitle: "高效排序与外部排序"
updated: "2026-08-29"
contributors: ["fjll-27"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～30 分钟"
---

# Lab 11-15：第 k 小整数（去重）

难度：进阶。题目原型为洛谷 [P1138 第 k 小整数](https://www.luogu.com.cn/problem/P1138)。本题的考点是**排序 + 去重后的边界处理**：`std::unique` 只把重复元素移到末尾，必须配合 `erase` 真正删除，且去重后数量不足 `k` 时要输出 `NO RESULT`。

## 目标

完成本题后，你应该能够：

- 用 `sort` + `unique` + `erase` 完成去重；
- 正确处理「去重后不足 `k` 个」的边界情况；
- 理解 `unique` 的返回值为什么是「新逻辑末尾」而不是直接改变容器大小。

## 前置知识

- `std::sort`；
- `std::unique` 与 `std::vector::erase`。

## 题目

读入 `n`、`k` 和 `n` 个整数。把所有整数去重后从小到大排列，输出第 `k` 小的整数；若去重后的整数不足 `k` 个，则输出 `NO RESULT`。

### 输入格式

- 第一行两个整数 `n`、`k`；
- 第二行 `n` 个整数。

### 输出格式

一行一个整数，或字符串 `NO RESULT`。

## 数据范围

| 项目 | 范围 |
| --- | --- |
| 数组长度 `n` | 1 ≤ n ≤ 10⁴ |
| 元素值 | −10⁶ ≤ a[i] ≤ 10⁶ |

## 样例

### 样例输入

```input
8 3
3 2 3 1 2 4 5 5
```

### 样例输出

```output
3
```

### 样例解释

去重后为 `1 2 3 4 5`，第 3 小的整数是 `3`。

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
pnpm lab:run -- labs/chapter-11/lab-11-15-kth-distinct
pnpm lab:score -- labs/chapter-11/lab-11-15-kth-distinct
```

标准输出参与判题，调试信息请写入标准错误。

## 完成清单

- [ ] 样例输出与题目一致
- [ ] 「去重后不足 k 个」与「全部相同」两种情况都通过
- [ ] 能说出 `unique` 返回的迭代器代表什么

## 思考题

1. 如果只调用 `unique` 而不调用 `erase`，会发生什么？`a.size()` 会变吗？
2. 本题 `|a[i]| ≤ 10⁶`，能不能用计数数组（桶）代替排序？两者分别适合什么数据范围？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

先 `sort`，再 `unique`。`unique` 把相邻重复元素移到末尾并返回新逻辑末尾迭代器，配合 `erase` 删除多余元素。之后比较去重后长度与 `k`：

- 若长度 `< k`，输出 `NO RESULT`；
- 否则输出 `a[k-1]`。

### 复杂度分析

- 时间复杂度：`O(n log n)`；
- 空间复杂度：`O(n)`（输入数组）。

</details>
