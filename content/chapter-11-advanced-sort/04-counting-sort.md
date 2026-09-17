---
title: "11.4 计数排序"
description: "计数排序的值域计数原理、前缀和回填、正确性证明与适用条件。"
order: 4
chapter: 11
chapterTitle: "高效排序与外部排序"
updated: "2026-09-16"
contributors: ["Ph1z"]
status: "draft"
---

# 11.4 计数排序

计数排序适用于整数序列，且关键字范围不大。它统计每个关键字出现次数，再按计数回填结果。

> **Ph1zの理解：** 计数排序就像唱票——不比较谁多谁少，直接数"得 1 票的有几人、得 2 票的有几人……"，然后按票数填回结果。快是快，但前提是票的种数（值域 $k$）不能太多，否则计数数组爆炸。

## 代码

```text
Algorithm CountingSort(A, n, k):
    Input: An array A of n elements, range of values is [0, k]
    Output: Array A sorted in ascending order

    // 1. 计数：统计每个值出现的次数
    Create array cnt[0...k] initialized to 0
    for i = 0 to n - 1 do
        cnt[A[i]] = cnt[A[i]] + 1
    end for

    // 2. 前缀和：cnt[i] 表示值 <= i 的元素个数
    for i = 1 to k do
        cnt[i] = cnt[i] + cnt[i - 1]
    end for

    // 3. 从后往前回填（保证稳定性）
    Create array out[0...n-1]
    for i = n - 1 down to 0 do
        cnt[A[i]] = cnt[A[i]] - 1
        out[cnt[A[i]]] = A[i]
    end for

    // 4. 拷贝回原数组
    for i = 0 to n - 1 do
        A[i] = out[i]
    end for

    return A
```

```cpp
void countingSort(int a[], int n, int k) {
    vector<int> cnt(k + 1, 0);                       // 计数数组
    for (int i = 0; i < n; ++i) ++cnt[a[i]];         // 1. 统计频次
    for (int i = 1; i <= k; ++i) cnt[i] += cnt[i - 1]; // 2. 前缀和
    vector<int> out(n);                              // 输出数组
    for (int i = n - 1; i >= 0; --i) {               // 3. 从后往前回填（保稳定）
        out[--cnt[a[i]]] = a[i];
    }
    for (int i = 0; i < n; ++i) a[i] = out[i];       // 4. 拷回原数组
}
```

## 优化代码

计数排序的核心限制是：**只能处理非负整数，且 \(k\) 不能太大**。以下是一种常见的优化方向：

```cpp
// 优化 1：支持负数和小范围浮点（通过偏移量映射到非负整数）
// 找出最小值和最大值，将 [min, max] 映射到 [0, max-min]
void countingSortWithOffset(int a[], int n) {
    if (n <= 1) return;

    // 1. 找出最小值和最大值
    int minVal = a[0], maxVal = a[0];
    for (int i = 1; i < n; ++i) {
        if (a[i] < minVal) minVal = a[i];
        if (a[i] > maxVal) maxVal = a[i];
    }

    int range = maxVal - minVal + 1;         // 值域范围
    vector<int> cnt(range, 0);

    // 2. 统计频次（通过偏移量映射）
    for (int i = 0; i < n; ++i) ++cnt[a[i] - minVal];

    // 3. 前缀和
    for (int i = 1; i < range; ++i) cnt[i] += cnt[i - 1];

    // 4. 从后往前回填（保稳定）
    vector<int> out(n);
    for (int i = n - 1; i >= 0; --i) {
        out[--cnt[a[i] - minVal]] = a[i];
    }

    // 5. 拷回原数组
    for (int i = 0; i < n; ++i) a[i] = out[i];
}
```

## 正确性证明

计数排序的核心是"`cnt[x]` 表示元素值不超过 `x` 的个数"。

- 计算前缀和后，`cnt[x]` 表示元素值 $\le x$ 的个数。
- 因此元素值为 `x` 的所有实例都应落在区间 `[cnt[x-1], cnt[x]-1]` 中。
- 从后往前遍历原数组并逆序填充，保证相等元素在输出中的相对顺序不被破坏。

> **为什么要从后往前填？** 因为 `cnt[x]` 是"不超过"的累积值，从后往前可以保证相同值的元素中，原数组中靠后的元素在输出中也靠后——这就是稳定性。

故最终输出严格按关键字递增排列。 ✓

## 复杂度分析

$$
T(n) = O(n + k).
$$

其中 $k$ 是关键字最大值（值域大小）。

**空间复杂度：** $O(k)$（计数数组）+ $O(n)$（输出数组）= $O(n + k)$。

**稳定性：** 稳定（若采用从后往前的逆序回填）。

> **适用条件：** 关键字是整数，且值域不大（$k = O(n)$ 或更小）。如果 $k \gg n$（比如 10 个数但值域到 $10^9$），计数数组爆炸，时间和空间都扛不住。这时候计数排序就不比比较排序好了——甚至更差。