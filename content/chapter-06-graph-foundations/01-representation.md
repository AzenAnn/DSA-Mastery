---
title: "6.1 图的表示"
description: "学习图的基本术语、邻接矩阵与邻接表的空间时间特征，以及存储选择依据。"
order: 1
chapter: 6
chapterTitle: "图的基础与存储"
updated: "2026-08-24"
contributors: ["Azen"]
status: "draft"
---

# 6.1 图的表示

图 $G=(V,E)$ 由顶点集 $V$ 与边集 $E$ 组成。记顶点数为 $n=|V|$、边数为 $m=|E|$。边有方向的称为**有向图**，无方向的称为**无向图**；边带数值代价的称为**带权图**。

## 学习目标

- 解释邻接、度、入度、出度、路径、回路与连通的含义；
- 实现邻接矩阵与邻接表；
- 比较两种表示的查询、遍历、增删边与空间复杂度；
- 根据图的稠密度和操作模式选择存储。

## 图的基本关系

在无向图中，边 `{u,v}` 表示双向关系，顶点的度是关联边数，全部顶点度数和为 $2m$。在有向图中，边 `(u,v)` 从 `u` 指向 `v`；`u` 的出度增加 1，`v` 的入度增加 1，全部入度和与出度和都等于 $m$。

路径是首尾相接的顶点/边序列；起点和终点相同的非空路径形成回路。无向图中任意两点互相可达的最大顶点集合称为连通分量；有向图还要区分弱连通与强连通。

::: pitfall 易错点 · 无向边的存储份数不等于边数
无向边在邻接表中通常保存两条邻接记录 `u -> v` 和 `v -> u`，但图论边数 $m$ 仍只计 1。分析空间或遍历时必须说明统计的是逻辑边还是邻接记录。
:::

## 邻接矩阵

用一个 $n\times n$ 矩阵 `A` 表示边。无权图可令 `A[i][j]=1` 表示存在边；带权图通常保存权值，并用独立的“不存在”标记区分零权边。

```cpp:line-numbers [adjacency-matrix.cpp]
#include <optional>
#include <vector>

class GraphMatrix {
public:
    explicit GraphMatrix(std::size_t n)
        : edges_(n, std::vector<std::optional<int>>(n)) {}

    void addDirectedEdge(std::size_t u, std::size_t v, int weight = 1) {
        edges_.at(u).at(v) = weight;
    }

    bool adjacent(std::size_t u, std::size_t v) const {
        return edges_.at(u).at(v).has_value();
    }

private:
    std::vector<std::vector<std::optional<int>>> edges_;
};
```

判断两点是否相邻为 $O(1)$，但枚举一个顶点的所有邻居必须扫描整行，为 $O(n)$；无论实际有多少条边，矩阵空间都是 $\Theta(n^2)$。无向图矩阵关于主对角线对称，可以压缩三角区域，但索引会更复杂。

::: warning 零权边不能用 0 表示“不存在”
带权图可能合法包含权重 0。若同时把矩阵初值 0 当作无边，就会丢失零权边语义。应使用 `optional`、布尔存在矩阵或不会与合法权值冲突的明确哨兵。
:::

## 邻接表

每个顶点保存实际出边列表。对无向图，添加 `{u,v}` 时在两端各放一条邻接记录。

```cpp:line-numbers [adjacency-list.cpp]
#include <vector>

struct Edge {
    std::size_t to;
    int weight;
};

class GraphList {
public:
    explicit GraphList(std::size_t n) : adjacency_(n) {}

    void addDirectedEdge(std::size_t u, std::size_t v, int weight = 1) {
        adjacency_.at(u).push_back({v, weight});
    }

    const std::vector<Edge>& neighbors(std::size_t u) const {
        return adjacency_.at(u);
    }

private:
    std::vector<std::vector<Edge>> adjacency_;
};
```

邻接表空间为 $\Theta(n+m)$（无向图实现存两倍边记录，渐近量级不变）；枚举顶点 `v` 的邻居为 $\Theta(\deg(v))$。若邻接容器是普通动态数组，判断是否存在指定边和删除边最坏要扫描该邻接表。

## 复杂度对比

| 操作 | 邻接矩阵 | 邻接表（动态数组） |
| --- | ---: | ---: |
| 空间 | $\Theta(n^2)$ | $\Theta(n+m)$ |
| 判断 `u -> v` | $\Theta(1)$ | $O(\deg^+(u))$ |
| 枚举 `u` 的邻居 | $\Theta(n)$ | $\Theta(\deg^+(u))$ |
| 添加边 | $\Theta(1)$ | 摊还 $O(1)$ |
| 删除边 | $\Theta(1)$ | $O(\deg^+(u))$ |
| 扫描整图的邻接关系 | $\Theta(n^2)$ | $\Theta(n+m)$ |

表中的 `deg+` 表示有向图出度；无向图直接写 `deg`。若邻接表改用哈希集合，指定边查询均摊可接近 $O(1)$，但会增加内存、常数与迭代顺序成本。

::: complexity 复杂度 · 表示会改变算法总成本
DFS/BFS 的控制逻辑相同，但邻接矩阵需要对每个取出的顶点扫描一整行，总时间 $\Theta(n^2)$；邻接表只扫描真实邻接记录，总时间 $\Theta(n+m)$。复杂度结论必须和表示放在一起陈述。
:::

## 怎样选择

| 场景 | 更自然的起点 | 原因 |
| --- | --- | --- |
| 边数接近 $n^2$、频繁查任意两点邻接 | 邻接矩阵 | 查询常数、连续内存、稠密时空间差距缩小 |
| 大规模稀疏图、频繁遍历真实边 | 邻接表 | 只存实际边，扫描为 $n+m$ |
| 顶点规模固定且很小 | 邻接矩阵 | 实现简单、常数小 |
| 邻居需按编号或权重有序 | 有序邻接表 | 顺序可直接用于算法，但更新成本增加 |
| 边频繁增删且要快速存在性查询 | 哈希邻接集合或混合索引 | 用额外空间加速指定边操作 |

表示不是全局标签。同一系统可能用邻接表作为主存储，再为少数热点查询增加集合索引；关键是明确单一事实来源和同步成本。

## 小结与自测

邻接矩阵用固定的 $n^2$ 单元换取常数相邻判断；邻接表用与真实边数成正比的空间换取高效邻居枚举。图算法的复杂度不仅由算法步骤决定，也由“怎样取得邻居”决定。

1. 无向图邻接矩阵为什么对称？若有自环，度数怎样计？
2. 对 `n=1000,m=2000` 的无向稀疏图，两种表示各保存多少数量级的单元？
3. 零权边为什么会让“0 表示无边”的矩阵设计失效？
4. 邻接表中怎样把指定边查询从线性扫描加速？代价是什么？
5. 分别说明矩阵和邻接表上的 BFS 总时间。

下一章继续学习[7.1 图的遍历](../chapter-07-graph-applications/01-traversal.md)。
