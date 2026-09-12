---
title: "Lab 05-E-22：亲戚"
description: "使用并查集维护亲戚关系，快速回答任意两人是否同族的询问。"
order: 27
chapter: 5
labId: "05E22"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "基础"
duration: "10～20 分钟"
---

# Lab 05-E-22：亲戚

并查集最直观的应用：把“关系”看成边，把“是否同族”看成连通性查询。

## 题目

某个社区有 $n$ 个人，亲戚关系具有传递性：若甲是乙的亲戚、乙是丙的亲戚，则甲也是丙的亲戚。

现已知 $m$ 对亲戚关系，并有 $q$ 次询问。每次询问两个人是否为亲戚。

## 输入格式

- 第一行三个整数 $n, m, q$ $(1 \leq n \leq 2\times 10^5,\ 0 \leq m, q \leq 2\times 10^5)$；
- 接下来 $m$ 行，每行两个整数 $u\ v$，表示 $u$ 和 $v$ 是亲戚；
- 接下来 $q$ 行，每行两个整数 $a\ b$，表示一次询问。

## 输出格式

- 对于每次询问输出一行：若 $a$ 和 $b$ 是亲戚输出 `Yes`，否则输出 `No`（自己和自己是亲戚）。

## 样例

### 样例输入
```input
5 3 4
1 2
2 3
4 5
1 3
1 5
4 4
2 4
```

### 样例输出
```output
Yes
No
Yes
No
```

### 样例解释

- 关系 `1-2`、`2-3` 把 $\{1,2,3\}$ 连成一族，`4-5` 把 $\{4,5\}$ 连成另一族；
- 询问 `1 3`：同族，输出 `Yes`；
- 询问 `1 5`：两族之间没有关系，输出 `No`；
- 询问 `4 4`：自己与自己当然是亲戚，输出 `Yes`；
- 询问 `2 4`：不同族，输出 `No`。

## 提示

可以把每个连通分量看成一族，用并查集的根作为一族的代表。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

把每个人看作一个节点，每对亲戚关系看作一条边。由传递性，两人同族当且仅当两节点连通。

用并查集维护：读入关系时逐对 `unite`，回答询问时比较 `find(a)` 与 `find(b)` 是否相同。
记得使用路径压缩与按大小/按秩合并，保证总复杂度接近线性。

### 复杂度分析

- **时间复杂度**：$O((n + m + q)\,\alpha(n))$，近似线性
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
        for (int i = 1; i <= n; ++i) fa[i] = i;   // 初始各自为族
    }
    int find(int x) {
        int r = x;                                   // 先找到根
        while (fa[r] != r) r = fa[r];
        while (fa[x] != r) {                         // 再沿途压缩
            int nxt = fa[x];
            fa[x] = r;
            x = nxt;
        }
        return r;
    }
    void unite(int a, int b) {
        fa[find(a)] = find(b);
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, q;
    cin >> n >> m >> q;
    DSU dsu(n);
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        dsu.unite(u, v);            // 每对关系合并一次
    }
    while (q--) {
        int a, b;
        cin >> a >> b;
        cout << (dsu.find(a) == dsu.find(b) ? "Yes" : "No") << '\n';
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-22-relatives-dsu
```
