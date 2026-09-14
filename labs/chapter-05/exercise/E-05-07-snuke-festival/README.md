---
title: "Lab 05-E-07：祭坛三元组"
description: "排序后枚举中间元素，用二分统计两侧合法方案数。"
order: 12
chapter: 5
labId: "05E07"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "基础"
duration: "15～25 分钟"
---

# Lab 05-E-07：祭坛三元组

静态的“排名查询”不必动用平衡树：先排序，再二分，一样能得到前驱与后继的计数。

## 题目

祭坛由上、中、下三件部件组成，每种部件各有 $n$ 个候选，大小分别为 $A_1, \dots, A_n$、$B_1, \dots, B_n$、$C_1, \dots, C_n$。

一件合法祭坛要求中部严格大于上部、下部严格大于中部。求一共能搭配出多少种不同的祭坛。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 10^5)$；
- 第二行 $n$ 个整数 $A_1, \dots, A_n$ $(1 \leq A_i \leq 10^9)$；
- 第三行 $n$ 个整数 $B_1, \dots, B_n$ $(1 \leq B_i \leq 10^9)$；
- 第四行 $n$ 个整数 $C_1, \dots, C_n$ $(1 \leq C_i \leq 10^9)$。

## 输出格式

- 输出一个整数：合法祭坛的种类数（不超过 $n^3$，请使用 64 位整数）。

## 样例

### 样例输入
```input
2
1 5
2 4
3 6
```

### 样例输出
```output
3
```

### 样例解释

- 枚举中部 $B_1 = 2$：上部比它小的有 $\{1\}$ 共 $1$ 个，下部比它大的有 $\{3, 6\}$ 共 $2$ 个，贡献 $1 \times 2 = 2$；
- 枚举中部 $B_2 = 4$：上部比它小的有 $\{1\}$ 共 $1$ 个，下部比它大的有 $\{6\}$ 共 $1$ 个，贡献 $1 \times 1 = 1$；
- 合计 $2 + 1 = 3$。

## 提示

三个元素满足链式不等式时，固定中间那个：答案 = 对每个 b，（A 中小于 b 的个数）×（C 中大于 b 的个数）之和。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

先把 $A$、$C$ 排序（$B$ 不需要有序）。对每个中部候选 $b$：

- `lower_bound(A, b)` 给出严格小于 $b$ 的上部个数 $x$；
- `upper_bound(C, b)` 给出小于等于 $b$ 的下部个数，用 $n$ 减去它得到严格大于 $b$ 的个数 $y$；
- 该 $b$ 贡献 $x \times y$。

对所有 $b$ 求和即为答案。排序 $O(n \log n)$，每个 $b$ 二分 $O(\log n)$。

这类“排序 + 枚举中间 + 二分两侧”的模式，是平衡树“排名/前驱查询”的静态版本，也是 AtCoder ABC077C 的原题。

### 复杂度分析

- **时间复杂度**：$O(n \log n)$
- **空间复杂度**：$O(n)$

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> A(n), B(n), C(n);
    for (auto& x : A) cin >> x;
    for (auto& x : B) cin >> x;
    for (auto& x : C) cin >> x;
    sort(A.begin(), A.end());
    sort(C.begin(), C.end());
    long long ans = 0;
    for (long long b : B) {
        long long x = lower_bound(A.begin(), A.end(), b) - A.begin();   // 严格小于 b
        long long y = C.end() - upper_bound(C.begin(), C.end(), b);     // 严格大于 b
        ans += x * y;
    }
    cout << ans << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-07-snuke-festival
```
