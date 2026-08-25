---
title: "Lab 05-11：最小堆的实现"
description: "从零实现基于数组的最小堆，支持插入、删除最小值、查询最小值操作。"
order: 11
chapter: 5
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 05-11：最小堆的实现

堆是一种特殊的完全二叉树，满足堆性质：对于最小堆，每个节点的值都不大于其子节点的值。本题要求你不使用标准库中的优先队列，而是基于数组手动实现最小堆。

## 题目

实现一个最小堆，初始为空。给定 $q$ 个操作：

- `I x`：将整数 $x$ 插入堆中；
- `D`：删除并输出当前堆中的最小值；
- `Q`：查询并输出当前堆中的最小值（不删除）。

若堆为空时执行 `D` 或 `Q`，输出 `Empty`。

## 输入格式

- 第一行一个整数 $q$ $(1 \leq q \leq 10^5)$；
- 接下来 $q$ 行，每行一个操作。

## 输出格式

- 对于每个 `D` 和 `Q` 操作，输出一行对应结果。

## 样例

### 样例输入
```input
10
I 5
I 3
Q
I 7
D
Q
D
D
Q
D
```

### 样例输出
```output
3
5
5
7
Empty
Empty
```

### 样例解释

- `I 5`、`I 3`：堆为 `[3, 5]`
- `Q`：最小值为 $3$，输出 `3`
- `I 7`：堆为 `[3, 5, 7]`
- `D`：删除最小值 $3$，输出 `3`，堆变为 `[5, 7]`
- `Q`：最小值为 $5$，输出 `5`
- `D`：删除 $5$，输出 `5`，堆变为 `[7]`
- `D`：删除 $7$，输出 `7`，堆为空
- `Q`：堆空，输出 `Empty`
- `D`：堆空，输出 `Empty`

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

用数组 `heap[1..size]` 存储完全二叉树，节点 $i$ 的左子节点为 $2i$，右子节点为 $2i+1$，父节点为 $\lfloor i/2 \rfloor$。

- **插入（up）**：将新元素放到数组末尾，然后不断与父节点比较，若小于父节点则交换，直到满足堆性质。
- **删除最小值（down）**：将堆顶（最小值）取出，把数组末尾元素放到堆顶，然后不断与较小的子节点比较并交换，直到满足堆性质。

### 复杂度分析

- **时间复杂度**：每次插入和删除均为 $O(\log n)$；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
using namespace std;

struct MinHeap {
    vector<int> h;
    MinHeap() { h.push_back(0); }
    void push(int x) {
        h.push_back(x);
        int i = (int)h.size() - 1;
        while (i > 1 && h[i] < h[i / 2]) {
            swap(h[i], h[i / 2]);
            i /= 2;
        }
    }
    int top() {
        return h.size() > 1 ? h[1] : -1;
    }
    bool empty() { return h.size() <= 1; }
    int pop() {
        if (empty()) return -1;
        int res = h[1];
        h[1] = h.back();
        h.pop_back();
        int i = 1, n = (int)h.size() - 1;
        while (2 * i <= n) {
            int j = 2 * i;
            if (j + 1 <= n && h[j + 1] < h[j]) j++;
            if (h[i] <= h[j]) break;
            swap(h[i], h[j]);
            i = j;
        }
        return res;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    MinHeap heap;
    while (q--) {
        char op;
        cin >> op;
        if (op == 'I') {
            int x; cin >> x;
            heap.push(x);
        } else if (op == 'D') {
            if (heap.empty()) cout << "Empty\n";
            else cout << heap.pop() << '\n';
        } else if (op == 'Q') {
            if (heap.empty()) cout << "Empty\n";
            else cout << heap.top() << '\n';
        }
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-11-min-heap-implementation
```
