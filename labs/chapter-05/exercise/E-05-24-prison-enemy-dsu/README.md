---
title: "Lab 05-E-24：关押罪犯"
description: "用扩展域并查集维护'不能同狱'约束，贪心求解同狱最大怨念值的最小值。"
order: 29
chapter: 5
labId: "05E24"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～40 分钟"
---

# Lab 05-E-24：关押罪犯

并查集不仅能维护“谁和谁在一起”，配合扩展域还能维护“谁和谁不能在一起”。

## 题目

监狱有 $n$ 名罪犯，要分到两座监狱（每座至少一人或不作要求）。两名罪犯若在同一座监狱，他们之间的怨念值就会引爆。共有 $m$ 对罪犯之间存在怨念值 $w$。

请选择一种分配方案，使**同狱罪犯之间的最大怨念值尽可能小**。输出这个最小化的最大值；若存在无冲突的分配方案（任意有怨念的罪犯都不同狱），输出 $0$。

## 输入格式

- 第一行两个整数 $n, m$ $(1 \leq n \leq 2\times 10^4,\ 0 \leq m \leq 10^5)$；
- 接下来 $m$ 行，每行三个整数 $a\ b\ w$ $(1 \leq a, b \leq n,\ a \neq b,\ 1 \leq w \leq 10^6)$，表示 $a$ 与 $b$ 之间的怨念值为 $w$。

## 输出格式

- 输出一个整数：所有分配方案中“同狱最大怨念值”的最小值；无冲突时输出 $0$。

## 样例

### 样例输入
```input
4 5
1 2 10
2 3 20
3 4 30
4 1 40
1 3 25
```

### 样例输出
```output
25
```

### 样例解释

- 按怨念值从大到小处理：`4-1(40)`、`3-4(30)` 必须分狱，于是 $1$ 和 $3$ 都被迫与 $4$ 分狱，即 $1,3$ 同狱；
- 接下来 `1-3(25)`：两人已在同一集合，这条怨念不可避免，答案即为 $25$；
- `2-3(20)`、`1-2(10)` 不再影响答案。

## 提示

从大到小处理：怨念越大越要优先分狱。维护“敌人集合”：把 $b$ 并入 $a$ 的敌人域、$a$ 并入 $b$ 的敌人域。
当某对罪犯已经在同一集合时，当前怨念值就是答案。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

把怨念值从大到小排序后依次处理，能分就分：每对 $(a, b, w)$ 必须分狱，用**扩展域并查集**维护——

开设 $2n$ 个节点，$i$ 表示罪犯 $i$ 本人，$i + n$ 表示“$i$ 的敌人”这一虚拟点。
处理 $(a, b)$ 时：

- 若 `find(a) == find(b)`：两人已被此前的约束迫入同一监狱，怨念 $w$ 必然引爆，输出 $w$；
- 否则施加约束 $a$ 与 $b$ 不同狱：`unite(a, b + n)`、`unite(b, a + n)`（$a$ 的敌人和 $b$ 同狱，反之亦然）。

所有约束均可满足则输出 $0$。按从大到小的顺序保证了第一个冲突就是最优答案。

### 复杂度分析

- **时间复杂度**：$O(m \log m + m\,\alpha(n))$（瓶颈在排序）
- **空间复杂度**：$O(n)$

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <algorithm>
#include <iostream>
#include <tuple>
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
    void unite(int a, int b) {
        fa[find(a)] = find(b);
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, int>> e(m);   // (a, b, w)
    for (auto& [a, b, w] : e) cin >> a >> b >> w;
    // 怨念从大到小排序
    sort(e.begin(), e.end(),
         [](const tuple<int, int, int>& x, const tuple<int, int, int>& y) {
             return get<2>(x) > get<2>(y);
         });
    DSU dsu(2 * n);                      // 扩展域：i + n 表示 i 的"敌人域"
    for (auto& [a, b, w] : e) {
        if (dsu.find(a) == dsu.find(b)) {   // 已被迫同狱 -> 怨念引爆
            cout << w << '\n';
            return 0;
        }
        dsu.unite(a, b + n);   // a 与 b 的敌人同狱
        dsu.unite(b, a + n);   // b 与 a 的敌人同狱
    }
    cout << 0 << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-24-prison-enemy-dsu
```
