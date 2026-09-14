---
title: "Lab 05-E-11：前 K 个高频元素"
description: "哈希计数配合大小为 K 的小根堆，求出现次数最多的 K 个值。"
order: 16
chapter: 5
labId: "05E11"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "基础"
duration: "15～25 分钟"
---

# Lab 05-E-11：前 K 个高频元素

维护一个大小不超过 K 的堆，让它始终装着“目前最强的 K 个候选”——这是堆处理数据流的典型套路。

## 题目

给定 $n$ 个整数，请找出其中出现次数最多的 $k$ 个值。

选取规则：先按出现次数从多到少取；次数相同时，优先取数值较小的。输出时按数值升序排列。

## 输入格式

- 第一行两个整数 $n, k$ $(1 \leq k \leq n \leq 10^5)$，保证不同值的个数不少于 $k$；
- 第二行 $n$ 个整数 $a_1, a_2, \dots, a_n$ $(|a_i| \leq 10^9)$。

## 输出格式

- 输出一行 $k$ 个整数，按数值升序输出出现次数最多的 $k$ 个值。

## 样例

### 样例输入
```input
6 2
1 1 2 2 2 3
```

### 样例输出
```output
1 2
```

### 样例解释

- 各值出现次数：$1$ 出现 $2$ 次，$2$ 出现 $3$ 次，$3$ 出现 $1$ 次；
- 取次数最多的前 $2$ 个：$2$（$3$ 次）、$1$（$2$ 次）；
- 按数值升序输出：`1 2`。

## 提示

堆顶保存“当前候选中最弱的一个”：新值的次数超过堆顶就替换它。次数相同时注意让数值大的先被替换。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

第一步用哈希表（或排序）统计每个值的出现次数。

第二步维护一个大小至多为 $k$ 的小根堆，堆里保存“目前最强的 $k$ 个候选”。
堆的弹出规则：次数最少者先出；次数相同则数值较大者先出（留小值）。

逐个把每个值 $(\text{次数}, \text{值})$ 入堆，堆大小超过 $k$ 就弹出堆顶。
全部处理完后，堆中留下的就是答案的 $k$ 个值，排序输出即可。

若直接对全部不同值排序，复杂度为 $O(n \log n)$；堆做法的优势在数据流场景——不必一次存下所有计数。

### 复杂度分析

- **时间复杂度**：$O(n \log k)$
- **空间复杂度**：$O(\text{不同值个数}) \leq O(n)$

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <algorithm>
#include <iostream>
#include <queue>
#include <unordered_map>
#include <utility>
#include <vector>
using namespace std;

// 小根堆比较器：次数少者在顶；次数相同则值大者在顶（大值先被淘汰）
struct Cmp {
    bool operator()(const pair<int, long long>& a, const pair<int, long long>& b) const {
        if (a.first != b.first) return a.first > b.first;
        return a.second < b.second;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    unordered_map<long long, int> cnt;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        ++cnt[x];
    }
    // 大小为 k 的小根堆：保存当前最强的 k 个候选
    priority_queue<pair<int, long long>, vector<pair<int, long long>>, Cmp> heap;
    for (auto& [v, c] : cnt) {
        heap.push({c, v});
        if ((int)heap.size() > k) heap.pop();   // 淘汰最弱候选
    }
    vector<long long> ans;
    while (!heap.empty()) {
        ans.push_back(heap.top().second);
        heap.pop();
    }
    sort(ans.begin(), ans.end());
    for (int i = 0; i < (int)ans.size(); ++i) {
        if (i) cout << ' ';
        cout << ans[i];
    }
    cout << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-11-top-k-frequent
```
