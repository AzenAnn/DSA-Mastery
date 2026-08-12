---
title: "5.1 图的表示"
description: "邻接矩阵与邻接表的空间时间特征，以及存储选择的操作依据。"
order: 1
chapter: 5
chapterTitle: "图"
updated: "2026-08-12"
contributors: ["Azen"]
status: "draft"
---

# 5.1 图的表示

图 `G = (V, E)` 由顶点集 `V`（`n` 个）与边集 `E`（`m` 条）组成。边有方向的称为**有向图**，无方向的为**无向图**；边带权值的为**带权图**。图的表示方式决定了每个操作的成本，是所有图算法的基础。

## 学习目标

- 实现邻接矩阵与邻接表两种存储；
- 比较两种存储的查询、遍历与空间复杂度；
- 根据图的稠密度与操作模式选择存储。

## 邻接矩阵

用一个 `n × n` 矩阵 `A` 表示：`A[i][j] = 1`（或边权）当且仅当存在从 `i` 到 `j` 的边。判断"两顶点是否相邻"是 `O(1)`，但存储需要 `O(n²)` 空间。

```cpp:line-numbers [adjacency-matrix.cpp]
class GraphMatrix {
public:
    explicit GraphMatrix(std::size_t n) : adj_(n, std::vector<int>(n, 0)) {}

    void add_edge(std::size_t u, std::size_t v, int w = 1) { adj_[u][v] = w; }

    bool adjacent(std::size_t u, std::size_t v) const { return adj_[u][v] != 0; }

    std::vector<int> neighbors(std::size_t u) const;  // 需要扫整行，O(n)

private:
    std::vector<std::vector<int>> adj_;
};
```

## 邻接表

每个顶点维护一条边链表（或动态数组），只存实际存在的边。遍历一个顶点的所有邻居是 `O(deg(v))`，总空间为 `O(n + m)`——对稀疏图远优于矩阵。

```cpp:line-numbers [adjacency-list.cpp]
class GraphList {
public:
    explicit GraphList(std::size_t n) : adj_(n) {}

    void add_edge(std::size_t u, std::size_t v, int w = 1) {
        adj_[u].push_back({v, w});   // 无向图需再 push 一条 (u, w)
    }

    const std::vector<Edge>& neighbors(std::size_t u) const { return adj_[u]; }

private:
    struct Edge { std::size_t to; int weight; };
    std::vector<std::vector<Edge>> adj_;
};
```

## 复杂度对比

| 操作 | 邻接矩阵 | 邻接表 |
| --- | --- | --- |
| 空间 | `O(n²)` | `O(n + m)` |
| 判断相邻 | `O(1)` | `O(deg(v))` |
| 遍历顶点 `v` 的邻居 | `O(n)` | `O(deg(v))` |
| 添加边 | `O(1)` | `O(1)` |
| 删除边 | `O(1)`（置 0） | `O(deg(v))` 查找 |

遍历整张图（访问所有边）时，矩阵需要 `O(n²)`，邻接表只需 `O(n + m)`——这就是大多数图算法选邻接表的原因。

::: tip 稠密图用矩阵，稀疏图用邻接表
边数接近 `n²`（稠密）时矩阵省去链表开销、缓存友好，且 `O(n²)` 与 `O(n+m)` 差异不大；边数远小于 `n²`（稀疏，大多数真实图）时邻接表在空间与遍历上全面占优。
:::

## 小结

表示方式是图算法的"接口契约"：同样的算法，换一种表示可能改变整体复杂度（例如遍历从 `O(n²)` 变 `O(n+m)`）。先定表示，再谈算法；这也是第 5.3 节 Prim 算法用矩阵、Dijkstra 用堆优化的存储选择逻辑。

## 练习

1. 无向图用邻接矩阵存储时有什么冗余？有向图呢？
2. `n = 1000`、`m = 2000` 的稀疏图，两种存储各占多少空间（按字节估算）？
3. 邻接表中如何判断"顶点 `u` 到 `v` 是否有边"？最坏复杂度是多少？
4. 什么场景下即使图很稀疏也值得用邻接矩阵？
