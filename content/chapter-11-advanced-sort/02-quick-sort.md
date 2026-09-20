---
title: "11.2 快速排序"
description: "快速排序的枢轴划分原理、正确性证明、最坏退化分析与工程优化策略。"
order: 2
chapter: 11
chapterTitle: "高效排序与外部排序"
updated: "2026-09-16"
contributors: ["Ph1z"]
status: "draft"
---

# 11.2 快速排序

快速排序选定一个枢轴元素 `pivot`，将数组划分为两部分：

- 左边均小于等于 `pivot`；
- 右边均大于等于 `pivot`；

然后递归处理左右两侧。

> **Ph1zの理解：** 快排的核心就一件事——**选标杆，分两边**。标杆左边的都比它矮，右边的都比它高，标杆自己已经站在最终位置了。然后左右两边各自再选标杆……分到不能再分，排序就完成了。简单粗暴，但非常高效喵

## 代码

```text
Algorithm Partition(A, l, r):
    Input: An array A, left index l, right index r
    Output: The final position of the pivot

    pivot = A[r]                    // 选择最右侧元素作为基准
    i = l - 1                       // i 指向 <= pivot 区域的末尾

    // 遍历 [l, r-1]，将 <= pivot 的元素移到左侧
    for j = l to r - 1 do
        if A[j] <= pivot then
            i = i + 1
            swap(A[i], A[j])        // 将小元素交换到左侧
        end if
    end for

    // 将 pivot 放到最终位置
    swap(A[i + 1], A[r])
    return i + 1

Algorithm QuickSort(A, l, r):
    Input: An array A, left index l, right index r
    Output: Array A[l...r] sorted in ascending order

    if l >= r then
        return                      // 递归终止：区间内元素 <= 1
    end if

    p = Partition(A, l, r)          // 划分，p 为基准的最终位置
    QuickSort(A, l, p - 1)          // 递归排序左半区
    QuickSort(A, p + 1, r)          // 递归排序右半区
```

```cpp
int partition(int a[], int l, int r) {
    int pivot = a[r];                // 选择最右元素为基准
    int i = l - 1;                   // i 指向 <= pivot 区域的末尾
    for (int j = l; j < r; ++j) {
        if (a[j] <= pivot) {
            ++i;
            std::swap(a[i], a[j]);   // 将小元素交换到左侧
        }
    }
    std::swap(a[i + 1], a[r]);       // 将 pivot 放到最终位置
    return i + 1;                    // 返回基准位置
}

void quickSort(int a[], int l, int r) {
    if (l >= r) return;              // 递归终止
    int p = partition(a, l, r);      // 划分
    quickSort(a, l, p - 1);          // 递归左半区
    quickSort(a, p + 1, r);          // 递归右半区
}
```

## 优化代码

快速排序的核心问题是：**当数据接近有序时，固定选择最右元素作为基准会导致划分极度不平衡，退化为 \(O(n^2)\)**。以下是几种常见的优化方向：

```cpp
// 优化 1：随机化基准（避免最坏情况）
// 随机选择基准，使期望时间复杂度稳定在 O(n log n)
#include <cstdlib>   // rand
int partitionRandom(int a[], int l, int r) {
    int randomIdx = l + rand() % (r - l + 1);   // 随机选一个位置
    std::swap(a[randomIdx], a[r]);              // 换到最右侧
    return partition(a, l, r);                  // 复用原 partition
}
```


```cpp
// 优化 2：三路划分（Dutch National Flag）
// 将数组分为 < pivot, == pivot, > pivot 三部分，处理大量重复元素
#include <cstdlib>   // rand
void quickSort3Way(int a[], int l, int r) {
    if (l >= r) return;

    int pivot = a[l + rand() % (r - l + 1)];   // 随机基准
    int lt = l, gt = r, i = l;                 // lt: <区末尾, gt: >区开头

    while (i <= gt) {
        if (a[i] < pivot) {
            std::swap(a[lt++], a[i++]);        // 放入 < 区
        } else if (a[i] > pivot) {
            std::swap(a[i], a[gt--]);          // 放入 > 区（i 不前进）
        } else {
            ++i;                               // == pivot，跳过
        }
    }
    // 递归处理 < 区和 > 区，== 区已就位
    quickSort3Way(a, l, lt - 1);
    quickSort3Way(a, gt + 1, r);
}
```

```cpp
// 优化 3：IntroSort（内省排序，STL 的 std::sort 实现）
// 快排 + 堆排 + 插入排序的组合：
//   - 深度过深时切换堆排序（避免 O(n^2) 最坏情况）
//   - 小区间切换插入排序（减少递归开销）
#include <algorithm>  // std::make_heap / std::sort_heap
#include <cmath>      // std::log2
void introSort(int a[], int l, int r, int depthLimit) {
    const int THRESHOLD = 16;

    // 小区间：插入排序
    if (r - l + 1 <= THRESHOLD) {
        for (int i = l + 1; i <= r; ++i) {
            int key = a[i];
            int j = i - 1;
            while (j >= l && a[j] > key) {
                a[j + 1] = a[j];
                --j;
            }
            a[j + 1] = key;
        }
        return;
    }

    // 递归深度过深：切换堆排序
    if (depthLimit == 0) {
        std::make_heap(a + l, a + r + 1);
        std::sort_heap(a + l, a + r + 1);
        return;
    }

    // 三数取中 + 划分
    int mid = l + (r - l) / 2;
    if (a[l] > a[mid])   std::swap(a[l], a[mid]);
    if (a[l] > a[r])     std::swap(a[l], a[r]);
    if (a[mid] > a[r])   std::swap(a[mid], a[r]);
    std::swap(a[mid], a[r]);

    int p = partition(a, l, r);

    introSort(a, l, p - 1, depthLimit - 1);
    introSort(a, p + 1, r, depthLimit - 1);
}

// 调用入口
void introSort(int a[], int n) {
    int depthLimit = 2 * (int)std::log2(n);    // 最大递归深度
    introSort(a, 0, n - 1, depthLimit);
}
```


## 正确性证明

设分区函数返回位置 `p`，则：

- 所有 `a[l..p-1] <= a[p]`；
- 所有 `a[p+1..r] >= a[p]`；
- `a[p]` 已处于最终位置。

**证明思路：**

- 扫描过程中，`i` 维护"已放置到左边的较小元素"位置的下界；
- 每遇到一个不大于 `pivot` 的元素，就放到 `i+1` 位置，保证左边区间全都满足条件；
- 最后把 `pivot` 交换到 `i+1` 位置，得到正确的分界。

随后递归处理左右两边，最终整个数组有序。 ✓

> **Ph1zの理解：** `partition` 就像体育课排队——选一个人当标杆，比他矮的站左边，比他高的站右边。标杆自己不用再动了。然后左右两队再各选标杆……直到每队只有 0 或 1 个人。

## 复杂度分析

| 情况 | 递推式 | 时间复杂度 | 直觉 |
|------|--------|-----------|------|
| 最好 | $T(n) = 2T(n/2) + O(n)$ | $O(n\log n)$ | 每次均匀划分，和归并排序一样 |
| 最坏 | $T(n) = T(n-1) + O(n)$ | $O(n^2)$ | 枢轴总是最值，退化为逐个扫描 |
| 平均 | 随机划分 | $O(n\log n)$ | 大部分划分比较均匀 |

> **最坏情况怎么来的？** 如果数组已经有序，而每次选最后一个元素做 pivot，那么左边是空集，右边是 $n-1$ 个元素——每层只减少一个元素，递归深度 $n$，每层工作量 $O(n)$，总计 $O(n^2)$。这在实际中是可能发生的！

**额外空间：** 递归栈 $O(\log n)$（平均），但最坏递归深度可达 $O(n)$。

**稳定性：** 不稳定。因为在分区交换过程中，等值元素可能跨过对方交换位置，顺序被打乱。

> **实战优化：** 工程上常用以下策略降低退化概率：
>
> | 策略 | 说明 | 效果 |
> |------|------|------|
> | 随机枢轴 | `swap(a[r], a[rand()])` | 期望均匀划分 |
> | 三数取中 | 取 `a[l]`, `a[mid]`, `a[r]` 的中值做 pivot | 避免已有序退化 |
> | 小段转插入 | 当子数组长度 < 某阈值时用插入排序 | 减少递归开销 |
> | 尾递归优化 | 先递归小的半边，大的半边用循环 | 保证栈深度 $O(\log n)$ |