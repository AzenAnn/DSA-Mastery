---
title: "11.5 桶排序"
description: "桶排序的分桶原理、正确性证明、均匀分布下的线性复杂度与最坏退化。"
order: 5
chapter: 11
chapterTitle: "高效排序与外部排序"
updated: "2026-09-16"
contributors: ["Ph1z"]
status: "draft"
---

# 11.5 桶排序

桶排序把值域划分成若干个区间（桶），把元素放进对应桶中，再在每个桶内排序，最后按桶序合并。

> **Ph1zの理解：** 桶排序就像按成绩分班——90~100 分一班，80~90 分一班……每个班内部再排成绩，最后按班序输出。如果成绩均匀分布，每个班人数差不多，班内排序很快，整体接近线性。但如果全挤在一个班……那就退化了。

## 代码

```text
Algorithm BucketSort(A, n, k):
    Input: An array A of n elements, number of buckets k
    Output: Array A sorted in ascending order

    // 1. 找出数组中的最小值和最大值
    minVal = A[0]
    maxVal = A[0]
    for i = 1 to n - 1 do
        if A[i] < minVal then minVal = A[i]
        if A[i] > maxVal then maxVal = A[i]
    end for

    // 2. 计算每个桶的区间跨度
    // 注意：range 需为浮点数，避免整数除法丢失精度
    range = (maxVal - minVal + 1) / k

    // 3. 创建 k 个空桶
    Create k empty buckets B[0...k-1]

    // 4. 将元素分配到对应的桶中
    for i = 0 to n - 1 do
        index = (A[i] - minVal) / range
        if index >= k then index = k - 1    // 边界处理：最大值可能越界
        B[index].add(A[i])
    end for

    // 5. 对每个桶内部进行排序（通常用插入排序）
    for i = 0 to k - 1 do
        Sort(B[i])
    end for

    // 6. 按顺序合并所有桶
    index = 0
    for i = 0 to k - 1 do
        for each element x in B[i] do
            A[index] = x
            index = index + 1
        end for
    end for

    return A
```

```cpp
void bucketSort(int a[], int n, int k) {
    if (n <= 1) return;

    // 1. 找出最小值和最大值
    int minVal = a[0], maxVal = a[0];
    for (int i = 1; i < n; ++i) {
        if (a[i] < minVal) minVal = a[i];
        if (a[i] > maxVal) maxVal = a[i];
    }

    // 2. 计算每个桶的区间跨度（使用 double 避免精度丢失）
    double range = (double)(maxVal - minVal + 1) / k;

    // 3. 创建 k 个桶
    vector<vector<int>> buckets(k);

    // 4. 将元素分配到对应的桶中
    for (int i = 0; i < n; ++i) {
        int idx = (int)((a[i] - minVal) / range);
        if (idx >= k) idx = k - 1;                   // 边界处理
        buckets[idx].push_back(a[i]);
    }

    // 5. 对每个桶内部排序
    for (int i = 0; i < k; ++i) {
        sort(buckets[i].begin(), buckets[i].end());  // 或插入排序
    }

    // 6. 按顺序合并所有桶
    int index = 0;
    for (int i = 0; i < k; ++i) {
        for (int x : buckets[i]) a[index++] = x;
    }
}
```

## 优化代码

桶排序的核心问题是：**桶的数量和桶内排序算法的选择直接影响性能**。以下是几种常见的优化方向：

```cpp
// 优化 1：桶内使用插入排序（桶内元素少时常数更小）
void bucketSortInsertion(int a[], int n, int k) {
    if (n <= 1) return;

    int minVal = a[0], maxVal = a[0];
    for (int i = 1; i < n; ++i) {
        if (a[i] < minVal) minVal = a[i];
        if (a[i] > maxVal) maxVal = a[i];
    }

    double range = (double)(maxVal - minVal + 1) / k;
    vector<vector<int>> buckets(k);

    for (int i = 0; i < n; ++i) {
        int idx = (int)((a[i] - minVal) / range);
        if (idx >= k) idx = k - 1;
        buckets[idx].push_back(a[i]);
    }

    // 桶内使用插入排序（对小数组更高效）
    int index = 0;
    for (int i = 0; i < k; ++i) {
        auto& b = buckets[i];
        for (int j = 1; j < (int)b.size(); ++j) {
            int key = b[j], t = j - 1;
            while (t >= 0 && b[t] > key) {
                b[t + 1] = b[t];
                --t;
            }
            b[t + 1] = key;
        }
        for (int x : b) a[index++] = x;
    }
}
```

```cpp
// 优化 2：动态桶数量（根据 n 自动调整桶数）
// 桶数经验值：sqrt(n) 或 n/常数
void bucketSortDynamic(int a[], int n) {
    if (n <= 1) return;

    int minVal = a[0], maxVal = a[0];
    for (int i = 1; i < n; ++i) {
        if (a[i] < minVal) minVal = a[i];
        if (a[i] > maxVal) maxVal = a[i];
    }

    // 动态确定桶数量（经验值）
    int k = (int)sqrt(n) + 1;
    double range = (double)(maxVal - minVal + 1) / k;
    vector<vector<int>> buckets(k);

    for (int i = 0; i < n; ++i) {
        int idx = (int)((a[i] - minVal) / range);
        if (idx >= k) idx = k - 1;
        buckets[idx].push_back(a[i]);
    }

    int index = 0;
    for (int i = 0; i < k; ++i) {
        sort(buckets[i].begin(), buckets[i].end());
        for (int x : buckets[i]) a[index++] = x;
    }
}
```

```cpp
// 优化 3：递归桶排序（桶内元素过多时继续分桶）
// 适用于数据分布极不均匀的场景
void bucketSortRecursive(vector<int>& a, int k) {
    if (a.size() <= 1) return;

    int minVal = a[0], maxVal = a[0];
    for (int x : a) {
        if (x < minVal) minVal = x;
        if (x > maxVal) maxVal = x;
    }
    if (minVal == maxVal) return;                    // 所有元素相同

    double range = (double)(maxVal - minVal + 1) / k;
    vector<vector<int>> buckets(k);

    for (int x : a) {
        int idx = (int)((x - minVal) / range);
        if (idx >= k) idx = k - 1;
        buckets[idx].push_back(x);
    }

    int index = 0;
    for (int i = 0; i < k; ++i) {
        if (buckets[i].size() > 1 && buckets[i].size() < a.size()) {
            // 桶内元素仍较多，递归分桶
            bucketSortRecursive(buckets[i], k);
        } else if (buckets[i].size() > 1) {
            sort(buckets[i].begin(), buckets[i].end());
        }
        for (int x : buckets[i]) a[index++] = x;
    }
}
```

```cpp
// 优化 4：原地桶排序（减少内存分配，使用链表连接桶）
// 适合内存受限场景，但实现复杂
struct Node {
    int val;
    Node* next;
    Node(int v) : val(v), next(nullptr) {}
};

void bucketSortLinkedList(int a[], int n, int k) {
    if (n <= 1) return;

    int minVal = a[0], maxVal = a[0];
    for (int i = 1; i < n; ++i) {
        if (a[i] < minVal) minVal = a[i];
        if (a[i] > maxVal) maxVal = a[i];
    }

    double range = (double)(maxVal - minVal + 1) / k;
    vector<Node*> heads(k, nullptr), tails(k, nullptr);

    // 分配到链表桶
    for (int i = 0; i < n; ++i) {
        int idx = (int)((a[i] - minVal) / range);
        if (idx >= k) idx = k - 1;
        Node* node = new Node(a[i]);
        if (!heads[idx]) heads[idx] = tails[idx] = node;
        else { tails[idx]->next = node; tails[idx] = node; }
    }

    // 对每个链表桶排序 + 收集
    int index = 0;
    for (int i = 0; i < k; ++i) {
        // 将链表转为 vector 排序（简化实现）
        vector<int> tmp;
        for (Node* p = heads[i]; p; p = p->next) tmp.push_back(p->val);
        sort(tmp.begin(), tmp.end());
        for (int x : tmp) a[index++] = x;
        // 释放链表
        while (heads[i]) { Node* t = heads[i]; heads[i] = heads[i]->next; delete t; }
    }
}
```


## 正确性证明

- 每个元素都会被放进唯一对应的桶；
- 桶内排序后，桶内元素从小到大排列；
- 按桶编号顺序输出时，所有桶之间的元素大小关系也正确；
- 因为桶编号按区间顺序排列，桶内排序保证区间内顺序正确，故合并后得到全局有序序列。 ✓

## 复杂度分析

设有 $m$ 个桶，平均每个桶里有 $n/m$ 个元素。若每个桶内用插入排序，复杂度为：

$$
T(n) = O(n) + m \cdot O\left(\left(\frac{n}{m}\right)^2\right) = O(n) + O\left(\frac{n^2}{m}\right).
$$

| 情况 | 时间复杂度 | 直觉 |
|------|-----------|------|
| 最好 | $O(n)$ | 每个桶最多 1 个元素，桶内不用排 |
| 平均（均匀分布） | $O(n)$ | 每桶 $\approx n/m$ 个，$m$ 取 $\Theta(n)$ 时 |
| 最坏 | $O(n^2)$ | 所有元素落入同一个桶，退化为插入排序 |

**空间复杂度：** $O(n)$（桶 + 桶内元素）。

**稳定性：** 视桶内排序策略而定；若桶内使用稳定排序并且按桶顺序合并，可保持稳定。