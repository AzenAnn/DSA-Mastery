---
title: "Lab 05-12：数据流中的中位数"
description: "使用双堆技巧（最大堆 + 最小堆）动态维护数据流的中位数。"
order: 12
chapter: 5
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～40 分钟"
---

# Lab 05-12：数据流中的中位数

中位数是有序序列中间的值。如果序列长度为奇数，中位数是中间那个数；若为偶数，中位数是中间两个数的平均值。在数据流场景中，数字逐个到达，需要实时维护中位数。

## 题目

给定一个数据流，数字逐个到达。你需要在每次插入后，输出当前数据流的中位数。

具体规则：
- 若当前数据个数为奇数，中位数为排序后的中间值；
- 若为偶数，中位数为排序后中间两个数的平均值（保留一位小数）。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 10^5)$，表示数据流长度；
- 第二行 $n$ 个整数，按到达顺序给出。

## 输出格式

- 输出 $n$ 行，第 $i$ 行表示插入前 $i$ 个数后的中位数。

## 样例

### 样例输入
```input
6
5 2 3 4 1 6
```

### 样例输出
```output
5.0
3.5
3.0
3.5
3.0
3.5
```

### 样例解释

- 插入 $5$：序列 `[5]`，中位数 $5.0$
- 插入 $2$：序列 `[2, 5]`，中位数 $(2+5)/2 = 3.5$
- 插入 $3$：序列 `[2, 3, 5]`，中位数 $3.0$
- 插入 $4$：序列 `[2, 3, 4, 5]`，中位数 $(3+4)/2 = 3.5$
- 插入 $1$：序列 `[1, 2, 3, 4, 5]`，中位数 $3.0$
- 插入 $6$：序列 `[1, 2, 3, 4, 5, 6]`，中位数 $(3+4)/2 = 3.5$

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

使用**双堆**技巧：

- **最大堆（`maxHeap`）**：存储较小的一半数据，堆顶是较小一半的最大值；
- **最小堆（`minHeap`）**：存储较大的一半数据，堆顶是较大一半的最小值。

维护两个堆的大小差不超过 $1$，且 `maxHeap` 的大小 >= `minHeap` 的大小（或相等）。

- 插入新数时，先与 `maxHeap` 堆顶比较决定放入哪个堆；
- 若大小失衡，从较大的堆移动堆顶到另一个堆；
- 求中位数时，若总个数为奇数，`maxHeap` 堆顶即为中位数；若为偶数，两个堆顶的平均值即为中位数。

### 复杂度分析

- **时间复杂度**：每次插入 $O(\log n)$，共 $O(n \log n)$；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <queue>
#include <iomanip>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    priority_queue<int> maxHeap; // 大根堆，存较小一半
    priority_queue<int, vector<int>, greater<int>> minHeap; // 小根堆，存较大一半
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        if (maxHeap.empty() || x <= maxHeap.top()) {
            maxHeap.push(x);
        } else {
            minHeap.push(x);
        }
        // 平衡两个堆的大小
        if ((int)maxHeap.size() > (int)minHeap.size() + 1) {
            minHeap.push(maxHeap.top()); maxHeap.pop();
        } else if ((int)minHeap.size() > (int)maxHeap.size()) {
            maxHeap.push(minHeap.top()); minHeap.pop();
        }
        double median;
        if (maxHeap.size() == minHeap.size()) {
            median = (maxHeap.top() + minHeap.top()) / 2.0;
        } else {
            median = maxHeap.top();
        }
        cout << fixed << setprecision(1) << median << '\n';
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-12-median-in-data-stream
```
