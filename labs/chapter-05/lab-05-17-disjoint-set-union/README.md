---
title: "Lab 05-17：并查集的实现"
description: "实现带路径压缩和按秩合并的并查集，支持合并集合与查询归属。"
order: 17
chapter: 5
labId: "05E12"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "入门"
duration: "15～25 分钟"
---

# Lab 05-17：并查集的实现

并查集（Disjoint Set Union, DSU）是一种处理集合合并与查询的数据结构，常用于连通性判断、最小生成树（Kruskal 算法）等场景。

## 题目

给定 $n$ 个元素，初始时每个元素自成一个集合。接下来有 $q$ 个操作：

- `1 a b`：将元素 $a$ 和 $b$ 所在的集合合并；
- `2 a b`：查询元素 $a$ 和 $b$ 是否属于同一集合，输出 `Yes` 或 `No`。

## 输入格式

- 第一行两个整数 $n$ 和 $q$ $(1 \leq n, q \leq 10^5)$；
- 接下来 $q$ 行，每行三个整数表示一个操作。

## 输出格式

- 对于每个查询操作，输出一行结果。

## 样例

### 样例输入
```input
5 6
2 1 2
1 1 2
2 1 2
1 3 4
2 1 4
2 3 4
```

### 样例输出
```output
No
Yes
No
Yes
```

### 样例解释

- 初始：每个元素各自独立 `{1}, {2}, {3}, {4}, {5}`
- `2 1 2`：$1$ 和 $2$ 不在同一集合，输出 `No`
- `1 1 2`：合并 $1$ 和 $2$，集合变为 `{1,2}, {3}, {4}, {5}`
- `2 1 2`：$1$ 和 $2$ 在同一集合，输出 `Yes`
- `1 3 4`：合并 $3$ 和 $4$，集合变为 `{1,2}, {3,4}, {5}`
- `2 1 4`：$1$ 和 $4$ 不在同一集合，输出 `No`
- `2 3 4`：$3$ 和 $4$ 在同一集合，输出 `Yes`

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

并查集的核心操作：

- **Find(x)**：找到 $x$ 所在集合的代表元素（根节点），同时进行路径压缩，将路径上所有节点的父节点直接指向根；
- **Union(a, b)**：找到 $a$ 和 $b$ 的根，若不同则将一个根的父节点设为另一个根。按秩合并（将较矮的树合并到较高的树下）可保证树高接近 $O(\alpha(n))$。

### 复杂度分析

- **时间复杂度**：每次操作近似 $O(\alpha(n))$，其中 $\alpha$ 为阿克曼函数的反函数，可视为常数；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
using namespace std;

struct DSU {
    vector<int> fa, rk;
    DSU(int n) {
        fa.resize(n + 1);
        rk.assign(n + 1, 0);
        for (int i = 0; i <= n; ++i) fa[i] = i;
    }
    int find(int x) {
        return fa[x] == x ? x : fa[x] = find(fa[x]);
    }
    void unite(int a, int b) {
        a = find(a), b = find(b);
        if (a == b) return;
        if (rk[a] < rk[b]) swap(a, b);
        fa[b] = a;
        if (rk[a] == rk[b]) rk[a]++;
    }
    bool same(int a, int b) {
        return find(a) == find(b);
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    DSU dsu(n);
    while (q--) {
        int t, a, b;
        cin >> t >> a >> b;
        if (t == 1) {
            dsu.unite(a, b);
        } else {
            cout << (dsu.same(a, b) ? "Yes" : "No") << '\n';
        }
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-17-disjoint-set-union
```
