---
title: "10.3 冒泡排序"
description: "冒泡排序的原理、正确性证明、复杂度分析与早停优化。"
order: 3
chapter: 10
chapterTitle: "排序"
updated: "2026-09-16"
contributors: ["Ph1z"]
status: "draft"
---

# 10.3 冒泡排序

每一趟相邻比较，若前一个大于后一个就交换。这样每一轮都能把当前最大元素"冒泡"到末尾。

> **Ph1zの理解：** 想象水里的气泡——越大的气泡浮得越快。每一轮扫描，最大的元素就像气泡一样一路"冒"到最后面。名字就是这么来的喵

## 代码

```text
Algorithm BubbleSort(A, n):
    Input: An array A of n elements
    Output: Array A sorted in ascending order

    // 外层循环：控制排序趟数，最多 n-1 趟
    for i = 0 to n - 2 do
        swapped = false             // 标记本趟是否发生交换

        // 内层循环：比较相邻元素，将最大值"冒泡"到末尾
        for j = 0 to n - i - 2 do
            if A[j] > A[j + 1] then
                swap(A[j], A[j + 1])
                swapped = true      // 记录发生了交换
            end if
        end for

        // 早停优化：若本趟无交换，说明数组已有序
        if swapped == false then
            break
        end if
    end for

    return A
```

```cpp
void bubbleSort(int a[], int n) {
    for (int i = 0; i < n - 1; ++i) {
        bool swapped = false;                // 本趟是否发生交换
        for (int j = 0; j < n - i - 1; ++j) {
            if (a[j] > a[j + 1]) {
                std::swap(a[j], a[j + 1]);
                swapped = true;              // 标记发生交换
            }
        }
        if (!swapped) break;                 // 早停：已有序
    }
}
```

## 优化代码

```cpp
// 优化 1：记录最后交换位置（减少无效比较）
// 每趟记录最后一次交换的位置，该位置之后的元素已经有序，无需再比较
void optimizedBubbleSort(int a[], int n) {
    int lastSwapPos = n - 1;                 // 最后一次交换的位置
    while (lastSwapPos > 0) {
        int bound = lastSwapPos;             // 本趟比较的边界
        lastSwapPos = 0;                     // 重置，准备记录本趟最后交换位置
        for (int j = 0; j < bound; ++j) {
            if (a[j] > a[j + 1]) {
                std::swap(a[j], a[j + 1]);
                lastSwapPos = j;             // 更新最后交换位置
            }
        }
    }
}
```

```cpp
// 优化 2：双向冒泡排序（鸡尾酒排序）
// 每趟同时从前往后和从后往前扫描，解决"乌龟问题"（小元素在末尾移动慢）
void cocktailSort(int a[], int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        // 正向冒泡：将最大值移到右端
        for (int i = left; i < right; ++i) {
            if (a[i] > a[i + 1]) std::swap(a[i], a[i + 1]);
        }
        --right;

        // 反向冒泡：将最小值移到左端
        for (int i = right; i > left; --i) {
            if (a[i - 1] > a[i]) std::swap(a[i - 1], a[i]);
        }
        ++left;
    }
}
```

## 正确性证明

**循环不变式：** 在一趟冒泡结束后，当前未排序区间的最大元素已经被放到区间末尾。

- 在一轮扫描中，如果 `a[j] > a[j+1]`，则交换，保证较大的元素向右移动。
- 经过整趟扫描，所有大于当前末尾元素的值都会被"冒"过去，因此最大值会落在末尾。
- 重复 $n-1$ 趟后（或早停），数组整体有序。 ✓

## 复杂度分析

| 情况 | 时间复杂度 | 直觉 |
|------|-----------|------|
| 最好 | $O(n)$ | 已排序 + 早停：第一趟没有交换，直接结束 |
| 最坏 | $\Theta(n^2)$ | 逆序：每次比较都要交换 |
| 平均 | $O(n^2)$ | 随机数据，约一半的比较需要交换 |

**空间复杂度：** $O(1)$。

**稳定性：** 稳定。因为只有 `a[j] > a[j+1]` 时才交换，相等元素不交换，顺序保持不变。

> **冒泡 vs 插入：** 两者最好都是 $O(n)$，最坏都是 $O(n^2)$，都是稳定的。但插入排序的实际移动次数更少（只移动必要的元素），冒泡排序每次交换要 3 次赋值。实战中插入排序通常更快。