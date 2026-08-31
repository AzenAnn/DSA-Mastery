---
title: "Lab 05-18：动态连通性查询"
description: "在并查集上维护连通分量数量，支持动态加边与查询当前连通分量数。"
order: 18
chapter: 5
labId: "05E13"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～35 分钟"
---

# Lab 05-18：动态连通性查询

在并查集中维护一个额外信息——当前连通分量的数量，并在合并时动态更新。

## 题目

给定 $n$ 个节点，初始时没有边，每个节点各自为一个连通分量。

有 $q$ 个操作：
- `1 u v`：在节点 $u$ 和 $v$ 之间添加一条边（保证不会添加重边）；
- `2`：查询当前连通分量的数量。

## 输入格式

- 第一行两个整数 $n$ 和 $q$ $(1 \leq n, q \leq 10^5)$；
- 接下来 $q$ 行，每行一个操作。

## 输出格式

- 对于每个查询操作，输出一行一个整数，表示当前连通分量数量。

## 样例

### 样例输入
```input
4 5
2
1 1 2
2
1 3 4
2
```

### 样例输出
```output
4
3
2
```

### 样例解释

- 初始：$4$ 个连通分量 `{1}, {2}, {3}, {4}`，输出 $4$
- `1 1 2`：连接 $1$ 和 $2$，连通分量变为 `{1,2}, {3}, {4}`
- `2`：查询，输出 $3$
- `1 3 4`：连接 $3$ 和 $4$，连通分量变为 `{1,2}, {3,4}`
- `2`：查询，输出 $2$

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

在标准并查集基础上维护一个变量 `count`，表示当前连通分量数量。

- 初始时 `count = n`；
- 每次执行 `Union(u, v)` 时，若 $u$ 和 $v$ 原本不在同一集合，则合并后 `count--`；
- 查询操作直接返回 `count`。

### 复杂度分析

- **时间复杂度**：每次操作近似 $O(\alpha(n))$；
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
    int count;
    DSU(int n) {
        fa.resize(n + 1);
        rk.assign(n + 1, 0);
        for (int i = 0; i <= n; ++i) fa[i] = i;
        count = n;
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
        count--;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    DSU dsu(n);
    while (q--) {
        int t;
        cin >> t;
        if (t == 1) {
            int u, v;
            cin >> u >> v;
            dsu.unite(u, v);
        } else {
            cout << dsu.count << '\n';
        }
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-18-dynamic-connectivity
```
