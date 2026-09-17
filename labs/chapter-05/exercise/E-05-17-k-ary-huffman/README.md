---
title: "Lab 05-E-17：k 叉哈夫曼树"
description: "拓展哈夫曼编码到 k 叉树，每次合并 k 个节点，求最小带权路径长度。"
order: 22
chapter: 5
labId: "05E17"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "35～50 分钟"
---

# Lab 05-E-17：k 叉哈夫曼树

普通哈夫曼树是二叉的，每次合并两个节点。本题将其推广到 $k$ 叉树，每次可以合并 $k$ 个节点，目标仍然是使带权路径长度最小。

## 题目

给定 $n$ 个叶子节点的权值，以及一个整数 $k$ $(k \geq 2)$。每次操作选择 $k$ 个节点合并为一个新节点，新节点的权值为这 $k$ 个节点权值之和，代价也为这个和。重复操作直到只剩一个节点。

若某次操作时剩余节点数不足 $k$ 个但大于 $1$ 个，也可以一次合并所有剩余节点。

求最小的总代价。

## 输入格式

- 第一行两个整数 $n$ 和 $k$ $(1 \leq n \leq 10^5, 2 \leq k \leq 10)$；
- 第二行 $n$ 个非负整数，表示各叶子节点的权值。

## 输出格式

- 输出一个整数，表示最小总代价。

## 样例

### 样例输入
```input
4 3
1 2 3 4
```

### 样例输出
```output
13
```

### 样例解释

四个叶子权值 $1, 2, 3, 4$，$k = 3$。

$k$ 叉哈夫曼树要求每次恰好合并 $k$ 个节点。如果直接贪心合并，第一步取出 $1, 2, 3$ 合成 $6$，第二步只剩 $4, 6$ 两个节点，凑不够 $3$ 个，不得不违反「每次恰好 $k$ 个」的规则。

正确做法是先补零：满足 $(n - 1) \bmod (k - 1) = 0$ 的 $n$ 个节点才能恰好归约到根。这里 $(4 - 1) \bmod (3 - 1) = 3 \bmod 2 = 1 \neq 0$，因此先补 $1$ 个权值为 $0$ 的虚拟节点：

1. 合并 $0, 1, 2$ → 新节点 $3$，代价 $3$；
2. 合并 $3$（虚拟合并结果）、$3$（原权值）、$4$ → 新节点 $10$，代价 $10$；
3. 只剩一个节点，结束。总代价 $= 3 + 10 = 13$。

虚拟节点让权值小的叶子「少占一层」，这正是带权路径长度最小的关键。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

$k$ 叉哈夫曼树的核心是：

1. 若 $(n - 1) \bmod (k - 1) \neq 0$，则需要补充权值为 $0$ 的虚拟节点，使得 $(n' - 1)$ 能被 $(k - 1)$ 整除；
2. 每次从最小堆中取出 $k$ 个最小权值的节点合并；
3. 累加合并代价。

补零的原因：在 $k$ 叉树中，每个非叶子节点必须有恰好 $k$ 个子节点（通过补零实现），这样才能保证树的结构最优。

### 复杂度分析

- **时间复杂度**：$O(n \log n)$；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <queue>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    priority_queue<long long, vector<long long>, greater<long long>> pq;
    for (int i = 0; i < n; ++i) {
        long long x; cin >> x;
        pq.push(x);
    }
    // 补充虚拟节点，使 (n-1) % (k-1) == 0
    while ((int)pq.size() > 1 && ((int)pq.size() - 1) % (k - 1) != 0) {
        pq.push(0);
    }
    long long total = 0;
    while ((int)pq.size() > 1) {
        long long sum = 0;
        for (int i = 0; i < k && !pq.empty(); ++i) {
            sum += pq.top(); pq.pop();
        }
        total += sum;
        pq.push(sum);
    }
    cout << total << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-17-k-ary-huffman
```
