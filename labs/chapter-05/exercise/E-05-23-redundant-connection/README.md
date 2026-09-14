---
title: "Lab 05-E-23：冗余连接"
description: "在无向图中逐条加边并用并查集判环，找出使图产生环的那条边。"
order: 28
chapter: 5
labId: "05E23"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "基础"
duration: "15～25 分钟"
---

# Lab 05-E-23：冗余连接

并查集的 `unite` 返回“是否发生有效合并”，这一信息正好用来检测环。

## 题目

一个 $n$ 个节点的无向图初始没有边。现在依次加入 $n$ 条边，加入某条边后图第一次出现环——

即这条边的两个端点在此前已经连通。请找出这条使图成环的边。

数据保证：前 $n-1$ 条边加入后图是一棵树，第 $n$ 条边使图恰好产生一个环，因此答案唯一（即环上在输入中最晚出现的那条边）。

## 输入格式

- 第一行一个整数 $n$ $(3 \leq n \leq 1000)$；
- 接下来 $n$ 行，每行两个整数 $u\ v$ $(1 \leq u, v \leq n,\ u \neq v)$，表示依次加入的边，保证无重边。

## 输出格式

- 输出一行两个整数 $u\ v$，表示使图成环的那条边（按输入中的顺序，先出现的端点在前）。

## 样例

### 样例输入
```input
5
1 2
2 3
3 4
4 5
1 4
```

### 样例输出
```output
1 4
```

### 样例解释

- 前四条边 `1-2, 2-3, 3-4, 4-5` 把 5 个节点连成一棵树；
- 加入 `1-4` 时，$1$ 和 $4$ 已经通过 $1-2-3-4$ 连通，这条边使环 $1-2-3-4-1$ 出现；
- 答案唯一，输出 `1 4`。

## 提示

逐条读入并尝试合并：若两个端点已在同一集合，当前边就是答案。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

按输入顺序逐条加边并维护并查集。对每条边 $(u, v)$：

- 若 `find(u) != find(v)`，合并两个集合，继续；
- 若 `find(u) == find(v)`，说明 $u, v$ 已经连通，当前边在图中形成了环，即为答案。

由于前 $n-1$ 条边构成树，第一次检测到两端连通时遇到的边，恰好是环上最晚输入的那条。

### 复杂度分析

- **时间复杂度**：$O(n\,\alpha(n))$
- **空间复杂度**：$O(n)$

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
using namespace std;

struct DSU {
    vector<int> fa;
    DSU(int n) {
        fa.resize(n + 1);
        for (int i = 1; i <= n; ++i) fa[i] = i;
    }
    int find(int x) {
        int r = x;                       // 先找到根
        while (fa[r] != r) r = fa[r];
        while (fa[x] != r) {             // 再沿途压缩
            int nxt = fa[x];
            fa[x] = r;
            x = nxt;
        }
        return r;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    DSU dsu(n);
    for (int i = 0; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        if (dsu.find(u) == dsu.find(v)) {   // 两端已连通 -> 成环
            cout << u << " " << v << '\n';
            return 0;
        }
        dsu.fa[dsu.find(u)] = dsu.find(v);  // 否则正常合并
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-23-redundant-connection
```
