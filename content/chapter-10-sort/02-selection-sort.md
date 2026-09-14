---
title: "10.2 选择排序"
description: "选择排序的原理、正确性证明、复杂度分析与不稳定性反例。"
order: 2
chapter: 10
chapterTitle: "排序"
updated: "2026-08-21"
contributors: ["Ph1z"]
status: "draft"
---

# 10.2 选择排序

每一趟从未排序区间里选择最小值，并交换到当前起始位置。

> **Ph1zの理解：** 选择排序就像排队——每次从剩下的人里挑最矮的，站到队首。简单吧？但每次挑人都要扫一遍，所以效率不高。

## 代码

```伪代码
Algorithm SelectionSort(A, n):
    Input: An array A of n elements
    Output: Array A sorted in ascending order

    // 遍历数组，确定每个位置的最小值
    for i = 0 to n - 2 do
        minIndex = i                // 假设当前位置是最小值

        // 在未排序区寻找真正的最小值
        for j = i + 1 to n - 1 do
            if A[j] < A[minIndex] then
                minIndex = j        // 更新最小值下标
            end if
        end for

        // 将找到的最小值交换到当前位置
        if minIndex != i then
            swap(A[i], A[minIndex])
        end if
    end for

    return A
```

```cpp
void selectionSort(int a[], int n) {
    for (int i = 0; i < n - 1; ++i) {
        int minIndex = i;               // 假设当前位置为最小值
        for (int j = i + 1; j < n; ++j) {
            if (a[j] < a[minIndex]) minIndex = j; // 更新最小值下标
        }
        if (minIndex != i) std::swap(a[i], a[minIndex]); // 交换到正确位置
    }
}
```

## 优化代码

```cpp
// 优化 1：二元选择排序（同时找最小值和最大值）
// 每轮循环同时确定最小值和最大值，循环次数减半
void binarySelectionSort(int a[], int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        int minIndex = left, maxIndex = left;
        // 同时寻找最小值和最大值
        for (int i = left; i <= right; ++i) {
            if (a[i] < a[minIndex]) minIndex = i;
            if (a[i] > a[maxIndex]) maxIndex = i;
        }
        if (minIndex != left) std::swap(a[left], a[minIndex]);
        // 注意：如果最大值恰好在 left 位置，交换后已被移到 minIndex
        if (maxIndex == left) maxIndex = minIndex;
        if (maxIndex != right) std::swap(a[right], a[maxIndex]);
        ++left;
        --right;
    }
}
```

```cpp
// 优化 2：堆排序（将选择排序的思想发挥到极致）
// 利用堆结构将"寻找最小值"的时间从 O(n) 降到 O(log n)
#include <algorithm>

void heapSort(int a[], int n) {
    // 1. 建堆（大顶堆）
    std::make_heap(a, a + n);
    
    // 2. 依次将堆顶（最大值）交换到末尾，并调整堆
    for (int i = n - 1; i > 0; --i) {
        std::pop_heap(a, a + i + 1); // 将堆顶移到 a[i]
    }
}
```

## 正确性证明

**循环不变式：** 在第 `i` 轮开始前，前 `i` 个位置已经放置了最小的 `i` 个元素，且它们按排序要求排列。

- **初始化：** `i = 0` 无前元素，成立。
- **保持：** 在未排序区间中选出最小值 `m`，把它交换到第 `i` 位，因此前 `i + 1` 个位置一定是当前最小的 `i + 1` 个元素。
- **终止：** 当 `i = n - 1` 时，全部元素有序。 ✓

## 复杂度分析

外层循环做 $n-1$ 趟，每趟扫描剩余部分，复杂度为：

$$
T(n) = \sum_{i=0}^{n-1} (n-i-1) = \frac{n(n-1)}{2} = O(n^2).
$$

> **注意：** 选择排序的最好、平均、最坏**全是** $O(n^2)$——它不像插入排序有"最好 $O(n)$"的福利，因为不管数组多有序，每趟都得扫完剩余部分才能确定最小值。

**空间复杂度：** $O(1)$。

**稳定性：** 不稳定。原因是交换最小值时，可能把与它相等的元素从后面交换到前面，打乱相对顺序。

> **反例：** `[5a, 5b, 3]`，第一趟选出最小值 `3` 与 `5a` 交换 → `[3, 5b, 5a]`，两个 `5` 的相对顺序变了。