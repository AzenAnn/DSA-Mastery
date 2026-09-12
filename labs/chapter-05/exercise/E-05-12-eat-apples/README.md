---
title: "Lab 05-E-12：吃苹果"
description: "用到期日最小堆模拟每天优先吃最先腐烂的苹果。"
order: 17
chapter: 5
labId: "05E12"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～30 分钟"
---

# Lab 05-E-12：吃苹果

一堆有时限的资源，每天消耗一个——“先到期先用”是这类贪心问题的通用原则。

## 题目

果园里有 $n$ 棵苹果树。第 $i$ 天，第 $i$ 棵树上会一次性长出 $a_i$ 个苹果，这些苹果从第 $i$ 天起可以食用，$d_i$ 天后腐烂（即第 $i$ 到第 $i + d_i - 1$ 天可食用）。

你每天最多吃一个苹果，也可以在拥有苹果的日子里不吃。求最多能吃多少个苹果。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 2\times 10^5)$；
- 第二行 $n$ 个整数 $a_1, \dots, a_n$ $(0 \leq a_i \leq 10^5)$；
- 第三行 $n$ 个整数 $d_1, \dots, d_n$ $(1 \leq d_i \leq 10^5)$。

## 输出格式

- 输出一个整数：最多能吃到的苹果数。

## 样例

### 样例输入
```input
4
1 2 3 5
2 5 3 2
```

### 样例输出
```output
6
```

### 样例解释

- 第 $1$ 天：长出的 $1$ 个苹果（第 $1\sim 2$ 天可吃），吃掉，累计 $1$；
- 第 $2$ 天：长出 $2$ 个（第 $2\sim 6$ 天可吃），吃 $1$ 个，累计 $2$；
- 第 $3$ 天：长出 $3$ 个（第 $3\sim 5$ 天可吃），优先吃先到期的，累计 $3$；
- 第 $4$ 天：长出 $5$ 个（第 $4\sim 5$ 天可吃），吃 $1$ 个，累计 $4$；
- 第 $5$ 天：吃第 $3$ 天的剩余，累计 $5$；第 $6$ 天：吃第 $2$ 天的剩余，累计 $6$；
- 第 $6$ 天后所有苹果腐烂，答案 $6$。

## 提示

用一个以“最后可食用日”为关键字的小根堆：每天把当天新长的苹果入堆，弹出已腐烂的，再吃堆顶。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

贪心原则：**每天优先吃最后可食用日最早的苹果**（最紧急的先消耗）。

用一个小根堆维护当前持有的苹果，关键字是“最后可食用日”：

1. 第 $i$ 天，把 $(i + d_i - 1,\ a_i)$ 入堆（$a_i > 0$ 时）；
2. 弹出所有最后可食用日 $< i$ 的批次（已腐烂）；
3. 若堆非空，从堆顶批次吃一个（剩余为 $0$ 则整体弹出），答案加 $1$。

第 $n$ 天之后可能还有未腐烂的苹果，继续按天吃直到堆空。由于每天最多吃一个，用一个计数器表示批次的剩余个数即可，不必逐个存苹果。

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
#include <utility>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n), d(n);
    for (auto& x : a) cin >> x;
    for (auto& x : d) cin >> x;
    // 小根堆: (最后可食用日, 该批次剩余个数)
    priority_queue<pair<int, long long>,
                   vector<pair<int, long long>>, greater<>> pq;
    long long eaten = 0;
    for (int day = 1; day <= n; ++day) {
        if (a[day - 1] > 0) pq.push({day + d[day - 1] - 1, (long long)a[day - 1]});
        while (!pq.empty() && pq.top().first < day) pq.pop();  // 清理腐烂
        if (!pq.empty()) {                                     // 吃最紧急的一批
            auto [exp, rem] = pq.top();
            pq.pop();
            if (--rem > 0) pq.push({exp, rem});
            ++eaten;
        }
    }
    // n 天之后继续吃剩下的
    long long day = (long long)n + 1;
    while (!pq.empty()) {
        while (!pq.empty() && pq.top().first < day) pq.pop();
        if (pq.empty()) break;
        auto [exp, rem] = pq.top();
        pq.pop();
        if (--rem > 0) pq.push({exp, rem});
        ++eaten;
        ++day;
    }
    cout << eaten << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-12-eat-apples
```
