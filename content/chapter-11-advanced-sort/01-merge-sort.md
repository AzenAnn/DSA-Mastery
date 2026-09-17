---
title: "11.1 归并排序"
description: "归并排序的分治原理、正确性证明、主定理复杂度分析与稳定性。"
order: 1
chapter: 11
chapterTitle: "高效排序与外部排序"
updated: "2026-09-16"
contributors: ["Ph1z"]
status: "draft"
---

# 11.1 归并排序

归并排序把数组一分为二，递归排序左右两半，再把两个有序子数组归并成一个有序数组。

> **Ph1zの理解：** 归并排序是分治思想的"教科书范例"——大问题拆成小问题，小问题解决了，合并起来大问题也解决了。就像整理一摞试卷：先分成两半分别排好，再把两摞有序的试卷逐个比较，合并成一摞。

## 代码

```text
Algorithm MergeSort(A, l, r):
    Input: An array A, left index l, right index r
    Output: Array A[l...r] sorted in ascending order

    // 递归终止条件：区间内元素少于等于 1 个
    if l >= r then
        return
    end if

    // 将区间一分为二
    mid = (l + r) / 2

    // 递归排序左半区和右半区
    MergeSort(A, l, mid)
    MergeSort(A, mid + 1, r)

    // 合并两个已有序的子区间
    Merge(A, l, mid, r)
```

```cpp
// 合并两个已有序的子区间 [l, mid] 和 [mid+1, r]
void merge(int a[], int l, int mid, int r) {
    std::vector<int> temp(r - l + 1);     // 辅助数组
    int i = l, j = mid + 1, k = 0;

    // 双指针合并：谁小取谁
    while (i <= mid && j <= r) {
        if (a[i] <= a[j]) temp[k++] = a[i++];   // <= 保证稳定性
        else              temp[k++] = a[j++];
    }
    while (i <= mid) temp[k++] = a[i++];        // 左半区剩余
    while (j <= r)   temp[k++] = a[j++];        // 右半区剩余

    // 拷贝回原数组
    for (int t = 0; t < k; ++t) a[l + t] = temp[t];
}

void mergeSort(int a[], int l, int r) {
    if (l >= r) return;              // 递归终止：区间内元素 <= 1
    int mid = (l + r) / 2;           // 将区间一分为二
    mergeSort(a, l, mid);            // 递归排序左半区
    mergeSort(a, mid + 1, r);        // 递归排序右半区
    merge(a, l, mid, r);             // 合并两个有序子区间
}
```

## 优化代码

归并排序的核心问题是：**需要额外的辅助空间 \(O(n)\)，且递归调用有函数开销**。以下是几种常见的优化方向：

```cpp
// 优化 1：全局辅助数组 + 迭代版（避免递归和频繁分配内存）
// 一次性分配辅助数组，避免每次 merge 都重新分配
void mergeSortIterative(int a[], int n) {
    std::vector<int> temp(n);                 // 一次性分配辅助空间

    // 自底向上：从长度为 1 的子区间开始，逐步合并
    for (int width = 1; width < n; width *= 2) {
        for (int l = 0; l < n; l += 2 * width) {
            int mid = std::min(l + width - 1, n - 1);
            int r   = std::min(l + 2 * width - 1, n - 1);
            if (mid >= r) continue;           // 无右半区，无需合并

            // 原地合并到 temp，再拷回 a
            int i = l, j = mid + 1, k = l;
            while (i <= mid && j <= r) {
                temp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];
            }
            while (i <= mid) temp[k++] = a[i++];
            while (j <= r)   temp[k++] = a[j++];
            for (int t = l; t <= r; ++t) a[t] = temp[t];
        }
    }
}
```

```cpp
// 优化 2：原地归并（不使用额外数组，但实现复杂）
// 时间换空间：时间复杂度略高于 O(n log n)，但空间为 O(1)
void inPlaceMerge(int a[], int l, int mid, int r) {
    int i = l, j = mid + 1;
    while (i < j && j <= r) {
        if (a[i] <= a[j]) {
            ++i;
        } else {
            // 将 a[j] 插入到 a[i] 前面，整体后移
            int value = a[j];
            int index = j;
            while (index > i) {
                a[index] = a[index - 1];
                --index;
            }
            a[i] = value;
            ++i;
            ++j;
            ++mid;                            // mid 也要右移
        }
    }
}
```

## 正确性证明

归并排序的证明使用"分治法 + 归并保持有序"。

- **归并前提：** 左右两半都已经有序（递归假设）。
- **归并过程：** 每次取两段头部较小的元素放进辅助数组，直到一段耗尽；另一个剩余元素直接追加。
- **归并结果：** 新数组中每次取出的元素都不小于已放入的元素，因此最终得到的数组有序。
- **递归基础：** 单元素显然有序。

> **Ph1zの理解：** 归并就像合并两个已经排好队的队伍——每次看两队排头谁更矮，谁先出列。因为两队本身有序，所以出队的人也一定是有序的。

因此整个数组最终有序。 ✓

## 复杂度分析

递推为：

$$
T(n) = 2T(n/2) + O(n).
$$

> **拆解：** $a = 2$（分成 2 个子问题），$b = 2$（每个规模减半），$f(n) = O(n)$（归并的代价）。$n^{\log_2 2} = n$，$f(n) = \Theta(n)$，属于主定理情况 2。

按主定理：

$$
T(n) = \Theta(n\log n).
$$

而且最好、平均、最坏**全是** $O(n\log n)$——归并排序不挑数据，稳定发挥。这是它最大的优点。

**额外空间：** 归并时需要辅助数组，$O(n)$。

**稳定性：** 稳定。因为归并时对相等元素优先取左侧段，保留原相对顺序。

> **归并排序 vs 快速排序：** 归并排序最坏也是 $O(n\log n)$，而且稳定——那为什么实战中快排更常用？因为快排是原地排序（不需要 $O(n)$ 辅助数组），而且缓存友好（数据访问局部性好），常数因子更小。归并排序则在对稳定性有要求的场景（如外部排序、链表排序）中不可替代。