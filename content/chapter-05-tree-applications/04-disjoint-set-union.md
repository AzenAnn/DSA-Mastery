---
title: "5.4 并查集"
description: "用双亲数组维护集合划分，掌握路径压缩、按秩合并及动态连通性与 Kruskal 应用。"
order: 4
chapter: 5
chapterTitle: "树的应用"
updated: "2026-08-24"
contributors: ["Azen"]
status: "review"
---

# 5.4 并查集

很多问题不关心集合内部的完整路径，只反复询问两件事：“这两个元素是否属于同一组？”以及“把两组合并”。并查集用一片树形森林保存代表关系，再通过路径压缩和合并启发式把树压得极浅。

## 学习目标

- 用不相交集合描述动态分组问题，并解释双亲数组的森林含义；
- 实现 `MakeSet`、`Find`、`Union`，说明每个操作维护的不变量；
- 区分路径压缩、按秩合并和按大小合并，避免混用元数据；
- 正确陈述 $O(m\alpha(n))$ 摊还复杂度的使用前提；
- 使用并查集处理增量动态连通性，并在 Kruskal 中判断加边是否成环；
- 识别并查集不支持删除、拆分、路径恢复等能力边界。

## 5.4.1 集合划分与树形表示（双亲数组）

### 集合划分

::: definition 定义 · 不相交集合族
给定全集 $U$，若干非空子集两两不相交，且它们的并集为 $U$，这些子集构成 $U$ 的一个<dfn>集合划分</dfn>。并查集（Disjoint Set Union，DSU）维护的就是随合并不断变化的集合划分。
:::

例如，全集 `{0,1,2,3,4,5,6}` 当前被划分为 `{0,2,5}`、`{1,4}`、`{3,6}`。每个集合选择一个<dfn>代表元</dfn>（representative）；代表元只用于识别集合，不必是最小值、最早值或业务上的“领导者”。

### 用森林表示集合

每个集合用一棵有根树表示：节点是元素，父链接指向同集合中的另一个元素，根作为代表元。多组集合就形成一片森林。

双亲数组 `parent` 保存：

```text [dsu-parent-array.txt]
元素：    0  1  2  3  4  5  6
parent：  0  1  0  3  1  2  3

集合树：  0        1       3
         /        /       /
        2        4       6
       /
      5
```

本页采用“根的父节点是自己”的约定，即 `parent[root] == root`。有些教材用负数表示根，并顺便在负值中保存集合大小；两种表示都可以，但查根、初始化和元数据规则必须一致。

::: property 性质 · 并查集森林不变量
任意时刻都应满足：

- 每个元素下标合法，并且恰好属于一棵树；
- 沿 `parent` 反复向上一定到达唯一自环根，不出现长度大于 1 的环；
- 两个元素属于同一集合，当且仅当它们最终到达同一个根；
- 合并只连接两个不同集合的根，不改变集合内部成员。
:::

## 5.4.2 基本操作（MakeSet / Find / Union）

### MakeSet

`MakeSet(x)` 建立只含 `x` 的集合：

$$
parent[x]\leftarrow x.
$$

若元素编号是 `0..n-1`，通常一次性初始化 `parent[i]=i`。重复对已在集合中的元素执行 `MakeSet` 会把它与原集合断开，除非接口明确允许重置，否则应禁止。

### Find

`Find(x)` 沿父链接找到根并返回代表元。最基础的迭代版本是：

```cpp:line-numbers [dsu-basic-find.cpp]
int findRoot(const std::vector<int>& parent, int x) {
    while (parent[x] != x) {
        x = parent[x];
    }
    return x;
}
```

它不改变结构，时间与当前树高成正比。

### Union

`Union(a,b)` 先分别找到根。如果根相同，两个元素已经同组；否则把一个根连接到另一个根。

```cpp:line-numbers [dsu-basic-union.cpp]
bool unite(std::vector<int>& parent, int a, int b) {
    int rootA = findRoot(parent, a);
    int rootB = findRoot(parent, b);
    if (rootA == rootB) return false;
    parent[rootB] = rootA;
    return true;
}
```

返回 `false` 表示集合划分没有变化。这个布尔结果在 Kruskal 中可以直接表达“加边会不会形成环”。

::: pitfall 易错点 · 必须连接根，而不是任意节点
直接执行 `parent[b] = a` 可能把 `b` 的子树从原集合中撕下来，或者在 `a` 位于 `b` 子树时制造环。正确合并先 `Find` 两端，再连接两个根。
:::

如果每次都把一棵大树挂到单节点下面，树高可能增长到 $n-1$，基础 `Find` 最坏为 $\Theta(n)$。优化的目标就是阻止这种长链。

## 5.4.3 优化：路径压缩与按秩 / 按大小合并、复杂度分析【进阶】（含 $\alpha(n)$）

### 路径压缩

在 `Find(x)` 找到根后，把搜索路径上的节点直接指向根。以后从这些节点查询会更快。

```text [path-compression.txt]
压缩前：0 <- 2 <- 5 <- 7
Find(7)
压缩后：0 <- 2
        0 <- 5
        0 <- 7
```

递归写法非常短：

```cpp:line-numbers [path-compression.cpp]
int find(int x) {
    if (parent_[x] != x) {
        parent_[x] = find(parent_[x]);
    }
    return parent_[x];
}
```

也可以分两次循环实现迭代路径压缩，避免极端初始长链导致递归栈过深。

### 按大小合并

为每个根维护集合节点数 `size[root]`。合并时总把小树根挂到大树根下面，并更新新根大小：

```cpp:line-numbers [union-by-size.cpp]
bool unite(int a, int b) {
    a = find(a);
    b = find(b);
    if (a == b) return false;
    if (size_[a] < size_[b]) std::swap(a, b);
    parent_[b] = a;
    size_[a] += size_[b];
    return true;
}
```

不做路径压缩时，按大小合并已能保证任意节点深度为 $O(\log n)$：节点深度每增加 1，它所在集合大小至少翻倍，而集合大小最多为 $n$。

### 按秩合并

<dfn>秩</dfn>（rank）是树高的上界估计。总把低秩根挂到高秩根；只有两根秩相等时，新根秩加 1。路径压缩后，`rank` 不再等于真实高度，但仍是合法的合并启发式元数据，不能在压缩后重新按当前局部高度随意修改。

按大小与按秩二选一即可；同时维护两套但更新规则不一致，只会制造错误。

### 完整 C++ 实现

```cpp:line-numbers [disjoint-set-union.cpp]
#include <numeric>
#include <stdexcept>
#include <utility>
#include <vector>

class DisjointSetUnion {
public:
    explicit DisjointSetUnion(int n)
        : parent_(checkedSize(n)), size_(checkedSize(n), 1), sets_(n) {
        std::iota(parent_.begin(), parent_.end(), 0);
    }

    int find(int x) {
        check(x);
        int root = x;
        while (parent_[root] != root) root = parent_[root];
        while (parent_[x] != x) {
            int next = parent_[x];
            parent_[x] = root;
            x = next;
        }
        return root;
    }

    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (size_[a] < size_[b]) std::swap(a, b);
        parent_[b] = a;
        size_[a] += size_[b];
        --sets_;
        return true;
    }

    bool connected(int a, int b) { return find(a) == find(b); }
    int componentSize(int x) { return size_[find(x)]; }
    int setCount() const { return sets_; }

private:
    static std::size_t checkedSize(int n) {
        if (n < 0) throw std::invalid_argument("negative size");
        return static_cast<std::size_t>(n);
    }

    void check(int x) const {
        if (x < 0 || x >= static_cast<int>(parent_.size())) {
            throw std::out_of_range("element out of range");
        }
    }

    std::vector<int> parent_;
    std::vector<int> size_;
    int sets_;
};
```

构造函数通过 `checkedSize` 在创建向量前拒绝负数，避免 `int` 先转换成巨大无符号长度。若接口改用 `std::size_t`，仍应在读取外部输入时先检查负数和范围。

::: complexity 复杂度 · $\alpha(n)$ 的准确表述
对 $n$ 个元素执行 $m$ 次 `MakeSet`、`Find`、`Union`，同时使用路径压缩与按秩或按大小合并时，总时间为

$$
O\bigl((n+m)\alpha(n)\bigr),
$$

常见简写为每次操作摊还 $O(\alpha(n))$。$\alpha$ 是反阿克曼函数，在现实规模下增长极慢，但这是一组操作序列的**摊还上界**，不是声称每次 `Find` 都严格常数时间，也不是任意朴素实现都自动拥有该界。
:::

## 5.4.4 实现【C/C++】与应用【拓展】（动态连通性、Kruskal）

### 增量动态连通性

无向图开始时没有边，每加入一条边 `(u,v)` 就执行 `unite(u,v)`；询问两点是否连通时执行 `connected(u,v)`。并查集不保存具体路径，只保存连通分量划分，因此比每次从头 DFS/BFS 更适合“只加边、频繁问连通”的场景。

::: example 示例 · 网络逐步连通
有 5 台设备，依次连线 `(0,1)`、`(3,4)`、`(1,4)`：

- 前两次合并后有 `{0,1}`、`{2}`、`{3,4}` 三个分量；
- 加入 `(1,4)` 后变成 `{0,1,3,4}` 与 `{2}`；
- `connected(0,3)` 为真，`connected(0,2)` 为假，`setCount()` 为 2。
:::

若需要删除边，删除一条非树边可能不影响连通，删除桥却会拆分集合。普通 DSU 无法逆向拆树；需要离线倒序、可回滚并查集、分治时间线或动态树等更强方法。

### Kruskal 最小生成树

Kruskal 按边权从小到大考虑无向边。若两端已在同一集合，加边会形成环，跳过；否则选中该边并合并分量。

```cpp:line-numbers [kruskal-with-dsu.cpp]
struct Edge { int u; int v; int weight; };

long long kruskal(int vertexCount, std::vector<Edge> edges) {
    std::sort(edges.begin(), edges.end(),
              [](const Edge& a, const Edge& b) { return a.weight < b.weight; });
    DisjointSetUnion dsu(vertexCount);
    long long total = 0;
    int chosen = 0;
    for (const Edge& edge : edges) {
        if (dsu.unite(edge.u, edge.v)) {
            total += edge.weight;
            if (++chosen == vertexCount - 1) break;
        }
    }
    if (vertexCount > 0 && chosen != vertexCount - 1) {
        throw std::runtime_error("graph is disconnected");
    }
    return total;
}
```

排序主导复杂度，为 $O(E\log E)$；并查集处理所有边的总成本接近线性。并查集只负责判环和合并，Kruskal 的最优性仍来自最小生成树的切分性质，不能用“DSU 很快”代替正确性证明。

### 能力边界

| 需求 | 普通 DSU 是否适合 | 原因 |
| --- | --- | --- |
| 只加边并查询连通 | 适合 | 合并与查询高效 |
| 返回两点之间的实际路径 | 不适合 | 父数组是代表森林，不是原图路径 |
| 删除边后保持在线连通查询 | 不直接支持 | 集合可能需要拆分 |
| 统计每个连通分量大小 | 适合 | 根维护 `size` |
| 判断有向图强连通分量 | 不适合 | 方向信息被集合划分丢失 |

::: pitfall 易错点 · DSU 父边不是业务图边
路径压缩会把节点直接连到代表根，这条父链接可能根本不是原图中的边。因此不能沿 `parent` 输出网络路径、MST 边或证明距离。
:::

## 小结与自测

并查集把每个集合表示为一棵代表树。`Find` 识别根，`Union` 连接两个根；路径压缩优化重复查询，按大小或按秩合并阻止小集合成为大树的父节点。两种优化共同给出近常数的摊还成本，但普通 DSU 只擅长合并，不擅长拆分和路径恢复。

1. 按给定 `parent` 数组画出森林，并写出每个元素的代表元。
2. 为什么 `parent[b]=a` 不能替代“先 Find 再连接根”？
3. 证明按大小合并且不压缩路径时，节点深度至多为 $O(\log n)$。
4. 路径压缩后为什么不能把 `rank` 直接解释为当前真实高度？
5. Kruskal 中 `unite(u,v)` 返回 `false` 为什么表示加边会成环？

下一节进入[5.5 B 树与 B+ 树](./05-b-tree-and-b-plus-tree.md)：它会把“降低树高”的思路从旋转和路径压缩扩展到外存页中的高分支节点。
