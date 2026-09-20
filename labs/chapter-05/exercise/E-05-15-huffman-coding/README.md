---
title: "Lab 05-E-15：哈夫曼编码"
description: "构建哈夫曼树，生成各字符的编码，并计算编码后的总长度。"
order: 20
chapter: 5
labId: "05E15"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～35 分钟"
---

# Lab 05-E-15：哈夫曼编码

哈夫曼编码是一种贪心算法，通过构建带权路径长度最短的二叉树（哈夫曼树），为出现频率高的字符分配较短的编码，从而实现数据压缩。

## 题目

给定 $n$ 个字符及其出现频率，构建哈夫曼树，计算并输出**哈夫曼编码的总长度**（即所有字符的 `频率 × 编码长度` 之和）。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 10^5)$；
- 第二行 $n$ 个非负整数，表示各字符的出现频率。

## 输出格式

- 输出一个整数，表示哈夫曼编码的总长度。

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

三个字符的频率分别为 $1, 2, 3$。

哈夫曼树的构建过程（每次合并频率最小的两个节点）：

1. 取出 $1$ 和 $2$，合并为新节点 $3$，当前总长度累计 $1 + 2 = 3$；
2. 堆中剩余 $3$（原频率）和 $3$（新节点），取出合并为新节点 $6$，累计 $3 + 3 = 6$；
3. 堆中只剩一个节点，构建结束，总长度 $= 3 + 6 = 9$。

树形结构如下：

```text
      6
     / \
    3   3
   / \
  1   2
```

各字符的编码长度（叶子深度）为：频率 $1$ 的字符深度 $2$，频率 $2$ 的字符深度 $2$，频率 $3$ 的字符深度 $1$。直接按定义求和验证：$1 \times 2 + 2 \times 2 + 3 \times 1 = 9$，与构建过程中的累计结果一致。

> 小技巧：每次合并产生的新节点，其权值会被**之后**每一次合并重复计入一次，因此「边合并边累加合并代价」得到的就是所有叶子的「频率 × 深度」之和（WPL），无需真的建树或统计深度。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

哈夫曼树的构建采用贪心策略：

1. 将每个频率作为一个节点放入最小堆；
2. 每次取出堆中两个最小频率的节点，合并为新节点（频率为两者之和）；
3. 将新节点放回堆中；
4. 重复直到堆中只剩一个节点。

哈夫曼编码总长度等于哈夫曼树的带权路径长度（WPL），可以在构建过程中累加：每次合并时，将两个子节点的频率之和累加到总长度中。

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
pnpm lab run labs/chapter-05/exercise/E-05-15-huffman-coding
```
