---
title: "Lab 11-14：求第 k 小的数"
description: "用快速选择（quickselect）在 O(n) 内定位第 k 小元素，避免全排序。"
order: 14
chapter: 11
chapterTitle: "高效排序与外部排序"
updated: "2026-08-29"
contributors: ["fjll-27"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "30～45 分钟"
---

# Lab 11-14：求第 k 小的数

难度：进阶。题目原型为洛谷 [P1923 【深基9.例4】求第 k 小的数](https://www.luogu.com.cn/problem/P1923)。本题的考点是**快速选择的划分剪枝**：每轮只需关心第 `k` 小的数落在哪一侧，另一侧直接丢弃，从而把全排序的 `O(n log n)` 压到平均 `O(n)`。

## 目标

完成本题后，你应该能够：

- 把「求第 k 小」转化为快速选择（quickselect）的划分问题；
- 用三路划分确定第 `k` 小的数落在小于 / 等于 / 大于基准的哪一段；
- 说明为什么 `n` 极大时必须用快速 I/O，且不能用 `O(n log n)` 全排序。

## 前置知识

- 11.2 快速排序的划分（partition）；
- 分治：只递归一侧。

## 题目

读入 `n`、`k` 和 `n` 个整数，输出其中第 `k` 小的数（`k` 从 1 开始计数，保证 `k ≤ n`）。

### 输入格式

- 第一行两个整数 `n`、`k`；
- 第二行 `n` 个整数。

### 输出格式

一行一个整数，表示第 `k` 小的数。

## 数据范围

| 项目 | 范围 |
| --- | --- |
| 数组长度 `n` | 1 ≤ n ≤ 5 × 10⁶ |
| 元素值 | −10⁹ ≤ a[i] ≤ 10⁹ |

## 样例

### 样例输入

```input
5 3
4 3 2 1 5
```

### 样例输出

```output
3
```

### 样例解释

排序后为 `1 2 3 4 5`，第 3 小的数是 `3`。

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
pnpm lab:run -- labs/chapter-11/lab-11-14-kth-smallest
pnpm lab:score -- labs/chapter-11/lab-11-14-kth-smallest
```

标准输出参与判题，调试信息请写入标准错误。

## 完成清单

- [ ] 样例输出与题目一致
- [ ] `k=1`（最小值）、`k=n`（最大值）、含重复值、含负数四种情况都通过
- [ ] 能说出为什么快速选择平均是 `O(n)` 而全排序是 `O(n log n)`

## 思考题

1. 如果每次划分都极不均匀，快速选择会退化成什么复杂度？如何用随机基准规避？
2. 为什么本题用 `scanf` 或关闭同步的 `cin`，而不用默认的 `cin`？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

把 `k` 转为 0 起下标。在 `[l, r]` 内取基准 `pivot` 做三路划分，得到三段：

- `[l, i-1]`：小于 `pivot`；
- `[i, j]`：等于 `pivot`；
- `[j+1, r]`：大于 `pivot`。

若 `k < i`，第 `k` 小在左侧；若 `k > j`，在右侧；否则就是 `pivot`。每轮只需处理一侧，迭代实现避免递归栈溢出。

### 复杂度分析

- 时间复杂度：平均 `O(n)`，最坏 `O(n²)`；
- 空间复杂度：`O(1)`（迭代，仅用原数组）。

</details>
