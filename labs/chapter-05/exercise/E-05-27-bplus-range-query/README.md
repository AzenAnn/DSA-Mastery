---
title: "Lab 05-E-27：B+ 树的范围查询"
description: "模拟 B+ 树的索引结构，支持按顺序插入关键字和区间查询，输出范围内关键字数量。"
order: 32
chapter: 5
labId: "05E27"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "40～60 分钟"
---

# Lab 05-E-27：B+ 树的范围查询

B+ 树是 B 树的变种，所有关键字都出现在叶子节点，且叶子节点通过指针连接形成有序链表。这使得 B+ 树特别适合区间查询。

## 题目

给定 $n$ 个操作：
- `I x`：将整数 $x$ 插入 B+ 树；
- `Q L R`：查询当前 B+ 树中值在 $[L, R]$ 范围内的关键字数量。

由于 B+ 树的完整实现较为复杂，本题要求你使用自己掌握的有序结构（树状数组、平衡树等）**模拟 B+ 树的叶子层有序链表与索引层**，并高效回答区间查询。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 2 \times 10^5)$；
- 接下来 $n$ 行，每行一个操作。

## 输出格式

- 对于每个 `Q` 操作，输出一行一个整数，表示 $[L, R]$ 范围内的关键字数量。

## 样例

### 样例输入
```input
8
I 5
I 3
I 7
Q 1 6
I 1
Q 2 5
I 9
Q 3 8
```

### 样例输出
```output
2
2
3
```

### 样例解释

逐条跟踪操作过程中关键字集合的变化：

1. `I 5`：插入 $5$，集合 $\{5\}$；
2. `I 3`：插入 $3$，集合 $\{3, 5\}$；
3. `I 7`：插入 $7$，集合 $\{3, 5, 7\}$；
4. `Q 1 6`：在 $[1, 6]$ 内的关键字为 $3, 5$，输出 $2$；
5. `I 1`：插入 $1$，集合 $\{1, 3, 5, 7\}$；
6. `Q 2 5`：在 $[2, 5]$ 内的关键字为 $3, 5$，输出 $2$；
7. `I 9`：插入 $9$，集合 $\{1, 3, 5, 7, 9\}$；
8. `Q 3 8`：在 $[3, 8]$ 内的关键字为 $3, 5, 7$，输出 $3$。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

B+ 树为什么擅长区间查询？关键在于它的两层结构：**叶子层**保存全部关键字并按序串成链表，**索引层**是叶子的「目录」，指向每一段叶子的取值范围。要统计 $[L, R]$ 内的关键字个数，目录让你 $O(\log n)$ 定位到起点，叶子链表保证范围内的数据连续，计数自然也是 $O(\log n)$ 级别的。

反过来想：如果只给你一条有序链表（比如 `std::set`），你能做到什么？

- `I x`：定位插入位置，$O(\log n)$，没问题；
- `Q L R`：`lower_bound(L)` 定位起点是 $O(\log n)$，但从起点到 $R$ 只能**顺着链表一个一个数**，代价 $O(k)$（$k$ 为区间内元素个数）。当查询区间很大、查询次数很多时，总复杂度退化为 $O(nq)$，无法接受。

也就是说，光有叶子链表而没有索引层，区间**计数**就无法做到对数级别。本题的解法正是「补上索引层」的一种实现：

1. **离散化充当目录**：由于操作总数 $n \leq 2 \times 10^5$，所有出现过的 $x$、$L$、$R$ 最多 $4 \times 10^5$ 个。把它们收集起来排序去重，每个值就映射为一个小下标——这一步相当于为叶子层建好了静态目录；
2. **树状数组充当索引层**：在离散化后的下标上维护树状数组，每个位置记录该关键字当前是否已插入。`I x` 即单点 $+1$（注意去重：重复插入同一个 $x$ 不应重复计数）；`Q L R` 答案为「$\leq R$ 的个数」减去「$< L$ 的个数」，即两次前缀和查询。

如果你熟悉 GNU 扩展，也可以用 PBDS 的 `tree`（`order_of_key`）直接在 $O(\log n)$ 内回答，效果等同于带索引层的平衡树；但 PBDS 在 MSVC 下不可用，树状数组的版本在任何主流编译器上都能通过。

### 复杂度分析

- **时间复杂度**：离散化 $O(n \log n)$，每次插入与查询均为 $O(\log n)$，总计 $O(n \log n)$；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <unordered_set>
using namespace std;

// 树状数组（Fenwick Tree）：维护离散化下标上的前缀和
struct Fenwick {
    int n;
    vector<int> t;
    void init(int n_) { n = n_; t.assign(n + 1, 0); }
    void add(int i, int v) { for (; i <= n; i += i & -i) t[i] += v; }
    int sum(int i) const { int r = 0; for (; i > 0; i -= i & -i) r += t[i]; return r; }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;

    // 先离线读入全部操作，收集所有出现过的数值用于离散化
    vector<char> op(n);
    vector<int> a(n), b(n), xs;
    for (int i = 0; i < n; ++i) {
        cin >> op[i] >> a[i];
        xs.push_back(a[i]);
        if (op[i] == 'Q') {
            cin >> b[i];
            xs.push_back(b[i]);
        }
    }
    sort(xs.begin(), xs.end());
    xs.erase(unique(xs.begin(), xs.end()), xs.end());

    Fenwick bit;
    bit.init((int)xs.size());
    unordered_set<int> seen;   // 去重：同一个关键字只计一次

    for (int i = 0; i < n; ++i) {
        if (op[i] == 'I') {
            if (seen.insert(a[i]).second) {
                int p = (int)(lower_bound(xs.begin(), xs.end(), a[i]) - xs.begin()) + 1;
                bit.add(p, 1);
            }
        } else {
            if (a[i] > b[i]) { cout << 0 << '\n'; continue; }   // 空区间
            // ≤ R 的个数 - < L 的个数
            int idxL = (int)(lower_bound(xs.begin(), xs.end(), a[i]) - xs.begin()) + 1;
            int idxR = (int)(upper_bound(xs.begin(), xs.end(), b[i]) - xs.begin());
            cout << bit.sum(idxR) - bit.sum(idxL - 1) << '\n';
        }
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-27-bplus-range-query
```
