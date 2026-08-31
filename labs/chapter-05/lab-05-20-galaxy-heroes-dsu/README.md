---
title: "Lab 05-20：银河英雄传说"
description: "使用带权并查集维护队列中的相对距离，支持合并队列与查询两舰之间的距离。"
order: 20
chapter: 5
labId: "05E15"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "45～60 分钟"
---

# Lab 05-20：银河英雄传说

有 $n$ 艘战舰，初始时各自为一列。有两种操作：
- `M i j`：将第 $i$ 列战舰所在的整个队列接到第 $j$ 列战舰所在队列的尾部；
- `C i j`：查询第 $i$ 艘战舰和第 $j$ 艘战舰是否在同一列，若是则输出它们之间间隔的战舰数量。

## 题目

给定 $T$ 组数据，每组数据包含若干操作，输出所有 `C` 操作的查询结果。

## 输入格式

- 第一行一个整数 $T$ $(1 \leq T \leq 5)$；
- 对于每组数据：若干行，每行一个操作，以 `END` 结束该组数据。

## 输出格式

- 对于每个 `C i j` 操作：
  - 若 $i$ 和 $j$ 不在同一列，输出 `-1`；
  - 否则输出它们之间间隔的战舰数量（即 $|pos_i - pos_j| - 1$）。

## 样例

### 样例输入
```input
1
M 1 2
M 2 4
C 1 4
C 2 4
M 3 1
C 3 4
END
```

### 样例输出
```output
1
0
2
```

### 样例解释

- `M 1 2`：队列变为 `2 -> 1`
- `M 2 4`：队列变为 `4 -> 2 -> 1`
- `C 1 4`：$1$ 和 $4$ 在同一列，位置分别为 $3$ 和 $1$，间隔 $3-1-1=1$ 艘
- `C 2 4`：$2$ 和 $4$ 在同一列，位置分别为 $2$ 和 $1$，间隔 $2-1-1=0$ 艘
- `M 3 1`：将 $3$ 所在队列（仅 $3$）接到 $1$ 所在队列尾部，队列变为 `4 -> 2 -> 1 -> 3`
- `C 3 4`：$3$ 和 $4$ 在同一列，位置分别为 $4$ 和 $1$，间隔 $4-1-1=2$ 艘

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

使用**带权并查集**维护每艘战舰到其所在列队头的距离，以及每列的长度。

- `d[i]`：战舰 $i$ 到其所在集合根节点（队头）的距离；
- `sz[i]`：以 $i$ 为根的集合（队列）的长度。

`M i j` 操作：将 $i$ 的根接到 $j$ 的根后面，更新距离和队列长度。

`C i j` 操作：先找到根判断是否在同一列，再用距离差计算间隔。

### 复杂度分析

- **时间复杂度**：每次操作近似 $O(\alpha(n))$；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <string>
using namespace std;

struct DSU {
    vector<int> fa, d, sz;
    DSU(int n) {
        fa.resize(n + 1);
        d.assign(n + 1, 0);
        sz.assign(n + 1, 1);
        for (int i = 0; i <= n; ++i) fa[i] = i;
    }
    int find(int x) {
        if (fa[x] == x) return x;
        int root = find(fa[x]);
        d[x] += d[fa[x]];
        return fa[x] = root;
    }
    void merge(int i, int j) {
        int fi = find(i), fj = find(j);
        if (fi == fj) return;
        fa[fi] = fj;
        d[fi] = sz[fj];
        sz[fj] += sz[fi];
    }
    int dist(int i, int j) {
        if (find(i) != find(j)) return -1;
        return abs(d[i] - d[j]) - 1;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        DSU dsu(30000);
        string op;
        while (cin >> op && op != "END") {
            int i, j;
            cin >> i >> j;
            if (op == "M") {
                dsu.merge(i, j);
            } else {
                cout << dsu.dist(i, j) << '\n';
            }
        }
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-20-galaxy-heroes-dsu
```
