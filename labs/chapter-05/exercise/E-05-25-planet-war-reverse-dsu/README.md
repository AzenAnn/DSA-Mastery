---
title: "Lab 05-E-25：星球大战"
description: "把删点操作倒序转化为加点，用逆向并查集维护连通块数量。"
order: 30
chapter: 5
labId: "05E25"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～40 分钟"
---

# Lab 05-E-25：星球大战

并查集擅长“加边”，不擅长“删边”。当操作必须删点时，一个经典技巧是：倒过来看。

## 题目

宇宙中有 $n$ 颗星球，星球之间有 $m$ 条双向航线。一个由航线连接的星球群称为一个连通块。

敌方将按顺序摧毁 $k$ 颗星球（每颗星球只被摧毁一次）。每摧毁一颗，与其相连的所有航线失效。对 $i = 1, 2, \dots, k$，请输出**前 $i$ 颗星球被摧毁后**，剩余星球中连通块的数量。

## 输入格式

- 第一行两个整数 $n, m$ $(1 \leq n \leq 2\times 10^5,\ 0 \leq m \leq 2\times 10^5)$；
- 接下来 $m$ 行，每行两个整数 $x\ y$，表示一条 $x$ 与 $y$ 之间的航线（$x \neq y$，无重边）；
- 下一行一个整数 $k$ $(1 \leq k \leq n)$；
- 接下来 $k$ 行，每行一个整数，按摧毁顺序给出被摧毁的星球编号。

## 输出格式

- 输出 $k$ 行，第 $i$ 行一个整数，表示前 $i$ 颗星球被摧毁后剩余星球的连通块数量。

## 样例

### 样例输入
```input
5 4
1 2
2 3
3 4
4 5
2
2
5
```

### 样例输出
```output
2
2
```

### 样例解释

- 摧毁 $2$ 号后，剩余 $\{1, 3, 4, 5\}$：航线 $3-4, 4-5$ 生效，连通块为 $\{1\},\{3,4,5\}$，输出 $2$；
- 再摧毁 $5$ 号后，剩余 $\{1, 3, 4\}$：航线 $3-4$ 生效，连通块为 $\{1\},\{3,4\}$，输出 $2$。

## 提示

正着做要支持“删点删边”，并查集做不到。倒过来看：从全部被摧毁的状态开始，**逆序把星球加回来**，
加点时把两端都已“活着”的航线重新连上——这就变成了纯粹的加边问题。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

**逆向并查集**。正着删点难以维护连通性，但并查集天然支持加边，因此把过程倒过来：

1. 先标记所有被摧毁的星球，把剩余星球之间的航线全部合并，得到初始连通块数 `comp`；
2. 按摧毁顺序的**逆序**，逐个“复活”星球 $v$：`comp++`，然后把所有一端是 $v$、另一端已活着的航线合并（每成功合并一次 `comp--`）；
3. 复活 $v$ 之后的 `comp` 正是“前 $i$ 颗被摧毁后”的答案（其中 $i$ 是 $v$ 在摧毁顺序中的位置）。

把第 2 步得到的数值按正序输出即可。每条航线在整个过程中最多被检查常数次，总复杂度接近线性。

### 复杂度分析

- **时间复杂度**：$O((n + m)\,\alpha(n))$
- **空间复杂度**：$O(n + m)$

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
        for (int i = 0; i <= n; ++i) fa[i] = i;
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
    // 合并两个集合，返回是否发生了有效合并
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        fa[ra] = rb;
        return true;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);      // 邻接表：复活时只遍历与自己相连的航线
    for (int i = 0; i < m; ++i) {
        int x, y;
        cin >> x >> y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    int k;
    cin >> k;
    vector<int> order(k);
    vector<char> dead(n + 1, 0);
    for (int i = 0; i < k; ++i) {
        cin >> order[i];
        dead[order[i]] = 1;          // 初始状态：前 k 颗全部被摧毁
    }
    DSU dsu(n);
    int comp = n - k;                // 还活着的星球各自成块
    for (int v = 1; v <= n; ++v)     // 预先合并两端都活着的航线
        if (!dead[v])
            for (int u : adj[v])
                if (!dead[u] && u > v) comp -= dsu.unite(u, v);
    vector<int> ans(k);
    for (int i = k - 1; i >= 0; --i) {   // 逆序复活
        ans[i] = comp;                   // 当前 comp = 前 i+1 颗被毁后的块数
        int v = order[i];
        dead[v] = 0;
        ++comp;                          // v 自身先成一个块
        for (int u : adj[v])             // 重新接入 v 的航线
            if (!dead[u]) comp -= dsu.unite(v, u);
    }
    for (int x : ans) cout << x << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-25-planet-war-reverse-dsu
```
