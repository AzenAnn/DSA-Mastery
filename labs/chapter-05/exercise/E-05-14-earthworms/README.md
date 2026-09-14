---
title: "Lab 05-E-14：蚯蚓"
description: "用三个单调队列维护“原位/切出两段”的蚯蚓，配合偏移量实现惰性堆。"
order: 19
chapter: 5
labId: "05E14"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "提高"
duration: "30～45 分钟"
---

# Lab 05-E-14：蚯蚓

如果每过一秒所有蚯蚓都等量变长，我们就不必真的修改每一条——记一个“公共偏移量”，让所有比较在相对值上进行。

## 题目

菜地里有 $n$ 条蚯蚓。每秒发生两件事：

1. 每条还活着的蚯蚓长度增加 $q$ 毫米；
2. 取出当前**最长**的一条，切成两段：一段长 $\lfloor u \cdot x / v \rfloor$ 毫米，另一段长 $x - \lfloor u \cdot x / v \rfloor$ 毫米（$x$ 为切断时刻的长度），两段留在菜地中继续生长。

请输出前 $m$ 秒每秒被切断蚯蚓的长度；再输出第 $t$ 秒结束后（$t \geq m$）菜地里全部 $n + t$ 条蚯蚓的长度（升序）。

## 输入格式

- 第一行六个整数 $n, m, q, u, v, t$ $(1 \leq n \leq 10^5,\ 1 \leq m \leq t \leq 2\times 10^5,\ 1 \leq q \leq 100,\ 1 \leq u < v \leq 100)$；
- 第二行 $n$ 个整数，表示初始时各蚯蚓的长度（不超过 $10^6$）。

## 输出格式

- 第一行 $m$ 个整数：第 $1$ 到第 $m$ 秒被切断蚯蚓的长度；
- 第二行 $n + t$ 个整数：第 $t$ 秒结束后所有蚯蚓的长度，升序输出。

## 样例

### 样例输入
```input
3 2 1 1 2 3
3 3 2
```

### 样例输出
```output
4 5
2 3 3 4 4 4
```

### 样例解释

- 初始长度为 $3, 3, 2$；
- 第 $1$ 秒：都长 $1$ 毫米变为 $4, 4, 3$，切一条最长的 $4$，切成 $2$ 与 $2$，记下 $4$，其余为 $4, 3, 2, 2$；
- 第 $2$ 秒：变为 $5, 4, 3, 3$，切最长的 $5$，切成 $2$ 与 $3$，记下 $5$，其余为 $4, 3, 3, 2, 3$；
- 第 $3$ 秒：变为 $5, 4, 4, 3, 4$，切一条最长的 $5$（$s > m$，不再输出），切成 $2$ 与 $3$；
- 最终菜地里有 $n + t = 6$ 条：$4, 4, 3, 4, 2, 3$，升序为 `2 3 3 4 4 4`。

## 提示

三个来源的蚯蚓（初始的、左段的、右段的）各自长度单调不增，各用一个队列维护队首即可 O(1) 取最大值；全局加一个偏移量代替逐条加 q。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

直接每次排序/堆取最大是 $O((n + t) \log(n + t))$，而利用**单调性**可以做到线性：

1. 初始蚯蚓降序放入队列 $Q_0$；每秒切出的左段进 $Q_1$、右段进 $Q_2$；
2. 由于每轮的切割值单调不增，$Q_1, Q_2$ 也是单调队列——三个队首的最大值就是当前最长蚯蚓；
3. 用偏移量 `off` 记录累计生长：队列中存“相对长度”，比较与输出时加上 `off`；
4. 每秒开始先 `off += q`（把本秒生长量计入偏移），再取最长者切断。设其真实长度为 $x$，则 $A = \lfloor x \cdot u / v \rfloor$、$B = x - A$ 为两段此刻的实际长度，以 `A - off`、`B - off` 入队——它们与其他蚯蚓共用同一偏移，从下一秒起自然同步生长。

长度相等时任取其一，切断值相同，不影响输出。

### 复杂度分析

- **时间复杂度**：$O(n + t)$
- **空间复杂度**：$O(n + t)$

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <algorithm>
#include <climits>
#include <deque>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long n, m, q, u, v, t;
    cin >> n >> m >> q >> u >> v >> t;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end(), greater<long long>());   // Q0：初始蚯蚓，降序
    deque<long long> q1, q2;                          // 切出的左段、右段（单调队列）
    long long off = 0;                                // 全局生长偏移
    size_t p = 0;
    vector<long long> cut;
    for (long long s = 1; s <= t; ++s) {
        off += q;                                     // 本秒生长量先计入偏移
        // 三队列队首取最大（相对值比较）
        long long best = LLONG_MIN;
        int which = 0;
        if (p < a.size() && a[p] > best) { best = a[p]; which = 0; }
        if (!q1.empty() && q1.front() > best) { best = q1.front(); which = 1; }
        if (!q2.empty() && q2.front() > best) { best = q2.front(); which = 2; }
        if (which == 0) ++p;
        else if (which == 1) q1.pop_front();
        else q2.pop_front();
        long long x = best + off;                     // 切断时刻的实际长度
        if (s <= m) cut.push_back(x);
        long long left = x * u / v;
        long long right = x - left;
        q1.push_back(left - off);                     // 以当前偏移为基准入队
        q2.push_back(right - off);
    }
    for (int i = 0; i < (int)cut.size(); ++i) {
        if (i) cout << ' ';
        cout << cut[i];
    }
    cout << '\n';
    // 收集第 t 秒后的实际长度并升序输出
    vector<long long> rest;
    for (; p < a.size(); ++p) rest.push_back(a[p] + off);
    for (auto x : q1) rest.push_back(x + off);
    for (auto x : q2) rest.push_back(x + off);
    sort(rest.begin(), rest.end());
    for (int i = 0; i < (int)rest.size(); ++i) {
        if (i) cout << ' ';
        cout << rest[i];
    }
    cout << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-14-earthworms
```
