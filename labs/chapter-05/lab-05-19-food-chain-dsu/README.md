---
title: "Lab 05-19：食物链"
description: "使用带权并查集维护节点间的相对关系，判断陈述的真伪。经典扩展域并查集问题。"
order: 19
chapter: 5
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "40～60 分钟"
---

# Lab 05-19：食物链

有 $n$ 个动物，编号 $1$ 到 $n$。每个动物属于且仅属于 $A, B, C$ 三种类型之一。食物链关系为：$A$ 吃 $B$，$B$ 吃 $C$，$C$ 吃 $A$。

两种陈述：
- `1 x y`：$x$ 和 $y$ 是同类；
- `2 x y`：$x$ 吃 $y$。

需要判断每个陈述是否为真。若与前面已知的真话矛盾，则为假话。输出假话的总数。

## 题目

给定 $n$ 个动物和 $k$ 个陈述，判断其中有多少个是假话。

假话判定规则：
1. 当前陈述中 $x$ 或 $y$ 大于 $n$，为假话；
2. `1 x y` 表示 $x$ 和 $y$ 同类，若已知 $x$ 吃 $y$ 或 $y$ 吃 $x$，为假话；
3. `2 x y` 表示 $x$ 吃 $y$，若已知 $x$ 和 $y$ 同类或 $y$ 吃 $x$，为假话。

## 输入格式

- 第一行两个整数 $n$ 和 $k$ $(1 \leq n \leq 5 \times 10^4, 1 \leq k \leq 10^5)$；
- 接下来 $k$ 行，每行三个整数 `d x y`。

## 输出格式

- 输出一个整数，表示假话的数量。

## 样例

### 样例输入
```input
100 7
1 101 1
2 1 2
2 2 3
2 3 3
1 1 3
2 3 1
1 5 5
```

### 样例输出
```output
3
```

### 样例解释

- `1 101 1`：$101 > 100$，假话（计数 1）
- `2 1 2`：真话，记录 $1$ 吃 $2$
- `2 2 3`：真话，记录 $2$ 吃 $3$
- `2 3 3`：$x=y$，一个动物不能吃自己，假话（计数 2）
- `1 1 3`：已知 $1$ 吃 $2$，$2$ 吃 $3$，根据传递性 $1$ 吃 $3$（即 $1$ 和 $3$ 不同类），假话（计数 3）
- `2 3 1`：真话，与前面一致（$3$ 被 $1$ 吃，即 $1$ 吃 $3$）
- `1 5 5`：$x=y$，同类陈述为真

假话总数为 $3$。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

使用**扩展域并查集**（或称**带权并查集**）：

- 对于每个动物 $x$，维护三个域：`x`（表示 $x$ 本身）、`x+n`（表示 $x$ 的猎物）、`x+2n`（表示 $x$ 的天敌）；
- `1 x y`（同类）：将 `x` 与 `y`、`x+n` 与 `y+n`、`x+2n` 与 `y+2n` 分别合并；
- `2 x y`（$x$ 吃 $y$）：将 `x` 与 `y+n`（$x$ 是 $y$ 的天敌）、`x+n` 与 `y+2n`（$x$ 的猎物是 $y$ 的天敌）、`x+2n` 与 `y`（$x$ 的天敌是 $y$ 的同类）分别合并。

判断假话：在执行合并前，检查是否与已知关系矛盾。

### 复杂度分析

- **时间复杂度**：$O(k \cdot \alpha(n))$；
- **空间复杂度**：$O(n)$。

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
        return fa[x] == x ? x : fa[x] = find(fa[x]);
    }
    void unite(int a, int b) {
        a = find(a), b = find(b);
        if (a != b) fa[a] = b;
    }
    bool same(int a, int b) {
        return find(a) == find(b);
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    DSU dsu(3 * n);
    int ans = 0;
    while (k--) {
        int d, x, y;
        cin >> d >> x >> y;
        if (x > n || y > n) { ans++; continue; }
        if (d == 1) {
            if (dsu.same(x, y + n) || dsu.same(x, y + 2 * n)) ans++;
            else {
                dsu.unite(x, y);
                dsu.unite(x + n, y + n);
                dsu.unite(x + 2 * n, y + 2 * n);
            }
        } else {
            if (x == y || dsu.same(x, y) || dsu.same(x, y + 2 * n)) ans++;
            else {
                dsu.unite(x, y + n);
                dsu.unite(x + n, y + 2 * n);
                dsu.unite(x + 2 * n, y);
            }
        }
    }
    cout << ans << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-19-food-chain-dsu
```
