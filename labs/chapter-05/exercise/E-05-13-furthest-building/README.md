---
title: "Lab 05-E-13：可以到达的最远建筑"
description: "用大小为 L 的小根堆动态保留最大的 L 个高度差，贪心分配梯子与砖块。"
order: 18
chapter: 5
labId: "05E13"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～40 分钟"
---

# Lab 05-E-13：可以到达的最远建筑

砖块可以补任意高度差，梯子通吃但数量稀少——把有限的“万能资源”留给最难跨过去的坎，是贪心也是堆的拿手戏。

## 题目

一条街上有一排建筑，高度依次为 $h_0, h_1, \dots, h_{n-1}$。你从 $0$ 号建筑出发向后走。

从 $i$ 号走到 $i+1$ 号时，若 $h_{i+1} \leq h_i$ 可以直接通过；否则需要攀上高度差 $\textit{diff} = h_{i+1} - h_i$：你可以消耗 $\textit{diff}$ 块砖，或者使用一把梯子（任意高度差都能一把过）。

共有 $b$ 块砖和 $l$ 把梯子，求最远能到达的建筑编号。

## 输入格式

- 第一行三个整数 $n, b, l$ $(2 \leq n \leq 10^5,\ 0 \leq b \leq 10^9,\ 0 \leq l \leq n)$；
- 第二行 $n$ 个整数 $h_0, \dots, h_{n-1}$ $(0 \leq h_i \leq 10^6)$。

## 输出格式

- 输出一个整数：最远可到达的建筑编号（从 $0$ 开始；若连 $0$ 号都无法离开也输出 $0$）。

## 样例

### 样例输入
```input
5 5 1
4 2 7 6 9
```

### 样例输出
```output
4
```

### 样例解释

- $0 \to 1$：高度下降，直接通过；
- $1 \to 2$：差 $5$。梯子和砖块都够用，先把差 $5$ 存入堆（堆大小 $1 \leq l$）；
- $2 \to 3$：高度下降，直接通过；
- $3 \to 4$：差 $3$。入堆后堆大小 $2 > l$，弹出最小的差 $3$，用 $3$ 块砖，剩 $5 - 3 = 2$ 块砖；
- 所有移动都能完成，最远到达 $4$ 号，输出 $4$。

## 提示

梯子只有 $l$ 把，意味着最多 $l$ 个高度差可以“白嫖”。用小根堆记住当前最大的 $l$ 个差，其余差必须靠砖块，砖不够就走不到。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

从左到右扫描每个正高度差 $\textit{diff}$：

1. 把 $\textit{diff}$ 放入一个小根堆；
2. 若堆大小超过 $l$，说明有高度差不能都用梯子——弹出堆中**最小**的差，用砖块支付它（$b \mathrel{-}= \textit{diff}$）；
3. 若某时刻 $b < 0$，说明走到当前这一步的砖块都不够，答案就是当前建筑编号 $i$。

全程砖块非负，则最远能到 $n - 1$。

**为什么正确**：砖块只能支付固定的差值，梯子却是“万能”的，所以梯子应该留给最大的 $l$ 个差；堆恰好动态维护着“当前已见过的差值中最大的 $l$ 个”，弹出最小者用砖支付，就是最优分配。

### 复杂度分析

- **时间复杂度**：$O(n \log n)$
- **空间复杂度**：$O(n)$

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long b;
    int l;
    cin >> n >> b >> l;
    vector<int> h(n);
    for (auto& x : h) cin >> x;
    priority_queue<int, vector<int>, greater<int>> pq;  // 当前最大的 l 个差中最小者
    for (int i = 0; i + 1 < n; ++i) {
        int diff = h[i + 1] - h[i];
        if (diff <= 0) continue;          // 下降无需资源
        pq.push(diff);
        if ((int)pq.size() > l) {         // 梯子不够用砖
            b -= pq.top();
            pq.pop();
            if (b < 0) {                  // 砖不够 -> 停在 i 号
                cout << i << '\n';
                return 0;
            }
        }
    }
    cout << n - 1 << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-13-furthest-building
```
