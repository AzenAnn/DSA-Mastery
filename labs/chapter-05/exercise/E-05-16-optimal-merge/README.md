---
title: "Lab 05-E-16：最优合并问题"
description: "将多个有序表合并为一个有序表，每次只能合并两个表，求最小合并代价。"
order: 21
chapter: 5
labId: "05E16"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～35 分钟"
---

# Lab 05-E-16：最优合并问题

在文件合并、外排序等场景中，经常需要将多个已有序的子文件合并为一个有序文件。每次合并两个长度为 $a$ 和 $b$ 的文件，代价为 $a+b$。如何选择合并顺序使得总代价最小？

## 题目

给定 $n$ 个有序表的长度，每次选择两个表合并，合并代价为两表长度之和。求将所有表合并为一个表所需的**最小总代价**。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 10^5)$；
- 第二行 $n$ 个整数，表示各有序表的长度。

## 输出格式

- 输出一个整数，表示最小合并总代价。

## 样例

### 样例输入
```input
3
1 2 3
```

### 样例输出
```output
9
```

### 样例解释

三段长度分别为 $1, 2, 3$。每次只能合并两段，代价为两段长度之和。

贪心策略（每次合并最短的两段）的执行过程：

1. 取出最短的两段 $1$ 和 $2$，合并为新段 $3$，代价 $1 + 2 = 3$，剩余 $3, 3$；
2. 取出 $3$ 和 $3$，合并为新段 $6$，代价 $3 + 3 = 6$；
3. 只剩一段，结束。总代价 $= 3 + 6 = 9$。

这个合并过程可以画成一棵树：每次合并对应一个内部节点，其权值为两段之和，总代价恰好等于所有内部节点权值之和。可以看到，它与哈夫曼树的构建过程完全一致——这正是本题与哈夫曼编码同源的原因。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

最优合并问题与哈夫曼编码本质相同，都是构建哈夫曼树求最小带权路径长度。

贪心策略：每次选取长度最小的两个有序表合并。可用最小堆维护当前所有表的长度，每次取出两个最小值合并，将新长度放回堆中。

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
    int n;
    cin >> n;
    priority_queue<long long, vector<long long>, greater<long long>> pq;
    for (int i = 0; i < n; ++i) {
        long long x; cin >> x;
        pq.push(x);
    }
    long long total = 0;
    while (pq.size() > 1) {
        long long a = pq.top(); pq.pop();
        long long b = pq.top(); pq.pop();
        long long c = a + b;
        total += c;
        pq.push(c);
    }
    cout << total << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-16-optimal-merge
```
