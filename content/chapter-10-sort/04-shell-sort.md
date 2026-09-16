---
title: "10.4 希尔排序"
description: "希尔排序的缩小增量原理、正确性论证、增量序列与复杂度分析。"
order: 4
chapter: 10
chapterTitle: "排序"
updated: "2026-08-21"
contributors: ["Ph1z"]
status: "draft"
---

# 10.4 希尔排序

希尔排序不是一次性按相邻元素比较，而是先按"间隔 $gap$"分组，组内做插入排序；随后逐渐缩小 $gap$，直到 $gap = 1$。

> **Ph1zの理解：** 普通插入排序只能一个一个挪，遇到逆序对就慢得要命。希尔排序的妙处在于——先大步跳着排，把远处的逆序对快速消除；再小步走，把细节理顺。就像整理书架，先把明显放错位置的大部头搬好，再微调每本书的位置。


## 代码

```伪代码
Algorithm ShellSort(A, n):
    Input: An array A of n elements
    Output: Array A sorted in ascending order

    // 外层循环：逐步缩小增量 gap，直到 gap = 1
    for gap = n / 2 down to 1 do
        // 对每个增量 gap，进行分组插入排序
        for i = gap to n - 1 do
            key = A[i]                  // 当前待插入元素
            j = i - gap                 // 同组前一个元素的位置

            // 在组内向前寻找插入位置，并后移元素
            while j >= 0 and A[j] > key do
                A[j + gap] = A[j]       // 组内元素后移
                j = j - gap             // 跳到同组前一个元素
            end while

            A[j + gap] = key            // 插入到正确位置
        end for
    end for

    return A
```

```cpp
void shellSort(int a[], int n) {
    for (int gap = n / 2; gap > 0; gap /= 2) {       // 增量序列：折半缩小
        for (int i = gap; i < n; ++i) {
            int key = a[i];                          // 当前待插入元素
            int j = i - gap;                         // 同组前一个元素
            while (j >= 0 && a[j] > key) {
                a[j + gap] = a[j];                   // 组内元素后移
                j -= gap;
            }
            a[j + gap] = key;                        // 插入到正确位置
        }
    }
}
```

## 优化代码


```cpp
// 优化 1：Hibbard 增量序列（2^k - 1）
// 最坏时间复杂度 O(n^(3/2))，性能显著优于折半序列
void shellSortHibbard(int a[], int n) {
    // 生成 Hibbard 序列：1, 3, 7, 15, 31, ...
    int gap = 1;
    while (gap < n / 2) gap = gap * 2 + 1;

    for (; gap > 0; gap = (gap - 1) / 2) {
        for (int i = gap; i < n; ++i) {
            int key = a[i];
            int j = i - gap;
            while (j >= 0 && a[j] > key) {
                a[j + gap] = a[j];
                j -= gap;
            }
            a[j + gap] = key;
        }
    }
}
```

```cpp
// 优化 2：Knuth 增量序列（3^k - 1）/ 2
// 最坏时间复杂度 O(n^(3/2))，实践表现优异
void shellSortKnuth(int a[], int n) {
    // 生成 Knuth 序列：1, 4, 13, 40, 121, ...
    int gap = 1;
    while (gap < n / 3) gap = gap * 3 + 1;

    for (; gap > 0; gap /= 3) {
        for (int i = gap; i < n; ++i) {
            int key = a[i];
            int j = i - gap;
            while (j >= 0 && a[j] > key) {
                a[j + gap] = a[j];
                j -= gap;
            }
            a[j + gap] = key;
        }
    }
}
```

```cpp
// 优化 3：Sedgewick 增量序列（综合性能最优）
// 最坏时间复杂度 O(n^(4/3))，是已知最优的实用序列之一
void shellSortSedgewick(int a[], int n) {
    // Sedgewick 序列：1, 5, 19, 41, 109, 209, ...
    std::vector<int> gaps;
    int k = 0;
    while (true) {
        int gap;
        if (k % 2 == 0) {
            int p = k / 2;
            gap = 9 * (1 << (2 * p)) - 9 * (1 << p) + 1;
        } else {
            int p = (k - 1) / 2;
            gap = (1 << (2 * p + 4)) - 3 * (1 << (p + 2)) + 1;
        }
        if (gap >= n) break;
        gaps.push_back(gap);
        ++k;
    }

    // 从大到小使用增量
    for (int idx = gaps.size() - 1; idx >= 0; --idx) {
        int gap = gaps[idx];
        for (int i = gap; i < n; ++i) {
            int key = a[i];
            int j = i - gap;
            while (j >= 0 && a[j] > key) {
                a[j + gap] = a[j];
                j -= gap;
            }
            a[j + gap] = key;
        }
    }
}
```
## 正确性证明

希尔排序的正确性基于"每次增量排序后，间隔为 `gap` 的子序列有序"。

- 对固定 `gap`，把数组拆成多个长度约为 $n/gap$ 的子序列。
- 对每个子序列做插入排序，保证该子序列内部有序。
- 当 `gap` 逐步缩小到 `1` 时，最终整个数组仍由插入排序保证有序。

> **Ph1zの理解：** 最后一步 $gap = 1$ 就是普通插入排序。但此时数组已经经过大步长的预处理，远处的逆序对已经很少了，所以这趟插入排序非常快——这就是希尔排序比纯插入排序快的根本原因。

因此在最后一轮 `gap = 1` 时，数组是有序的。 ✓

## 复杂度分析

希尔排序的复杂度依赖于增量序列。常见的 $gap = n/2, n/4, \ldots, 1$（Shell 原始序列），复杂度通常在 $O(n^{1.5})$ 到 $O(n^2)$ 之间，最坏可能达到 $O(n^2)$。

> **增量序列的选择很关键：**
>
> | 增量序列 | 最坏时间复杂度 | 说明 |
> |---------|--------------|------|
> | Shell 原始：$n/2, n/4, \ldots, 1$ | $O(n^2)$ | 简单但不够优 |
> | Hibbard：$2^k - 1$ | $O(n^{1.5})$ | 常用，效果不错 |
> | Sedgewick | $O(n^{4/3})$ | 更优，工程常用 |
> | Pratt（所有 $2^p 3^q$） | $O(n\log^2 n)$ | 接近最优但序列太长 |

**空间复杂度：** $O(1)$。

**稳定性：** 不稳定。因为元素可能跨不同 `gap` 距离移动，破坏原等值元素的相对顺序。