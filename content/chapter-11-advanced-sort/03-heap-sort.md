---
title: "11.3 堆排序"
description: "堆排序的堆结构原理、正确性证明、建堆 O(n) 分析与原地特性。"
order: 3
chapter: 11
chapterTitle: "高效排序与外部排序"
updated: "2026-09-16"
contributors: ["Ph1z"]
status: "draft"
---

# 11.3 堆排序

堆排序借助最大堆或最小堆。建立堆后，每次把堆顶元素放到数组尾部，调整堆，再继续做。

> **Ph1zの理解：** 堆排序就像一个选拔赛——堆顶永远是当前最强的人。每轮把最强的人"淘汰"到最终位置，然后重新组织剩下的比赛（siftDown 恢复堆性质）。重复 $n$ 轮，选拔完成。

## 代码

```text
Algorithm HeapSort(A, n):
    Input: An array A of n elements
    Output: Array A sorted in ascending order

    // 1. 建堆：从最后一个非叶子节点开始，依次向下调整
    MakeHeap(A, n)

    // 2. 排序：依次将堆顶（最大值）交换到末尾，并缩小堆的范围
    for i = n - 1 down to 1 do
        swap(A[0], A[i])            // 将堆顶最大值放到最终位置
        SiftDown(A, 0, i)           // 对剩余元素重新维护大根堆
    end for

    return A

Algorithm MakeHeap(A, n):
    Input: An array A of n elements
    Output: A converted into a max-heap

    // 从最后一个非叶子节点开始，依次向前调整
    for i = n / 2 - 1 down to 0 do
        SiftDown(A, i, n)
    end for

Algorithm SiftDown(A, i, n):
    Input: An array A, current node index i, heap size n
    Output: Subtree rooted at i satisfies max-heap property

    while 2 * i + 1 < n do
        left = 2 * i + 1            // 左孩子
        right = 2 * i + 2           // 右孩子
        largest = i

        // 找出父节点和左右孩子中的最大值
        if left < n and A[left] > A[largest] then
            largest = left
        end if
        if right < n and A[right] > A[largest] then
            largest = right
        end if

        // 若父节点已是最大值，调整结束
        if largest == i then
            break
        end if

        swap(A[i], A[largest])      // 交换并继续向下调整
        i = largest
    end while
```

```cpp
// 向下调整：维护以 i 为根的大根堆
void siftDown(int a[], int i, int n) {
    while (2 * i + 1 < n) {
        int left = 2 * i + 1;               // 左孩子
        int right = 2 * i + 2;              // 右孩子
        int largest = i;                    // 假设父节点最大

        if (left < n && a[left] > a[largest])   largest = left;
        if (right < n && a[right] > a[largest]) largest = right;

        if (largest == i) break;            // 父节点已是最大，调整结束

        std::swap(a[i], a[largest]);        // 交换并继续向下调整
        i = largest;
    }
}

// 建堆：从最后一个非叶子节点开始，依次向下调整
void makeHeap(int a[], int n) {
    for (int i = n / 2 - 1; i >= 0; --i) {
        siftDown(a, i, n);
    }
}

void heapSort(int a[], int n) {
    makeHeap(a, n);                         // 建大根堆
    for (int i = n - 1; i > 0; --i) {
        std::swap(a[0], a[i]);              // 堆顶（最大值）放到末尾
        siftDown(a, 0, i);                  // 对剩余元素重新维护堆
    }
}
```

## 优化代码

堆排序的核心问题是：**建堆和调整过程中存在大量无效比较，且交换操作频繁**。以下是两种常见的优化方向：

```cpp
// 优化 1：用"赋值"替代"交换"（减少 2/3 的赋值操作）
// 原始 siftDown 每次交换需要 3 次赋值，改为"暂存 + 移动"只需 1 次
void siftDownOptimized(int a[], int i, int n) {
    int key = a[i];                         // 暂存当前节点
    while (2 * i + 1 < n) {
        int child = 2 * i + 1;              // 左孩子
        // 选较大的孩子
        if (child + 1 < n && a[child + 1] > a[child]) {
            ++child;
        }
        if (a[child] <= key) break;         // 孩子不大于 key，停止

        a[i] = a[child];                    // 孩子上移（赋值而非交换）
        i = child;
    }
    a[i] = key;                             // 将 key 放到最终位置
}
```

```cpp
// 优化 2：原地堆排序 + 迭代版本（避免递归）
// 完全非递归实现，适合对栈空间敏感的场景
void heapSortIterative(int a[], int n) {
    // 建堆
    for (int i = n / 2 - 1; i >= 0; --i) {
        int parent = i;
        int key = a[parent];
        while (2 * parent + 1 < n) {
            int child = 2 * parent + 1;
            if (child + 1 < n && a[child + 1] > a[child]) ++child;
            if (a[child] <= key) break;
            a[parent] = a[child];
            parent = child;
        }
        a[parent] = key;
    }

    // 排序
    for (int i = n - 1; i > 0; --i) {
        std::swap(a[0], a[i]);
        int parent = 0;
        int key = a[parent];
        while (2 * parent + 1 < i) {
            int child = 2 * parent + 1;
            if (child + 1 < i && a[child + 1] > a[child]) ++child;
            if (a[child] <= key) break;
            a[parent] = a[child];
            parent = child;
        }
        a[parent] = key;
    }
}
```


## 正确性证明

堆的核心性质：堆顶一定是当前最大值（大根堆）。

- 建堆后，堆顶元素是当前最大元素。
- 把堆顶与末尾交换后，最大元素已落到最终位置；剩余前部仍构成堆。
- 重新执行 `siftDown`，恢复堆性质。
- 重复这一过程，最终所有元素从大到小依次被放到最终位置，因此数组整体有序。 ✓

> **Ph1zの理解：** 堆是一种"部分有序"的结构——只保证父节点 ≥ 子节点，不保证左右子节点的大小关系。但这已经够了：我们只需要每轮知道谁是最大值，不需要完全排序。

## 复杂度分析

| 步骤 | 复杂度 | 说明 |
|------|--------|------|
| 建堆 | $O(n)$ | 从底向上 siftDown，看似 $O(n\log n)$ 实则 $O(n)$ |
| 取堆顶 + 调整 | $(n-1) \times O(\log n)$ | 每次 siftDown 最多走树高 $\log n$ |

所以：

$$
T(n) = O(n) + O(n\log n) = O(n\log n).
$$

最好、平均、最坏都为 $O(n\log n)$——堆排序和归并排序一样，不挑数据，不退化。

> **建堆为什么是 $O(n)$ 而不是 $O(n\log n)$？** 直觉上，$n$ 个元素每个 siftDown 最多 $\log n$，应该是 $O(n\log n)$。但实际上，**大部分节点在树的下层**，siftDown 路径很短。精确计算：$\sum_{h=0}^{\log n} \frac{n}{2^{h+1}} \cdot O(h) = O(n)$。叶子节点（占一半）根本不用动！

**空间复杂度：** $O(1)$（原地排序）。

**稳定性：** 不稳定。因为堆顶与末尾交换时，等值元素可能发生位置变化。

> **堆排序的独特价值：** 它是唯一一个既原地（$O(1)$ 额外空间）又最坏 $O(n\log n)$ 的比较排序。归并排序需要 $O(n)$ 额外空间，快排最坏 $O(n^2)$——堆排序两头都占了。但它的缓存不友好（数据访问跳跃大），所以实测通常比快排慢。