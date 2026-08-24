---
title: "7.2 最小生成树与最短路径"
description: "学习 Prim、Kruskal 与 Dijkstra 的贪心策略、正确性前提和表示相关复杂度。"
order: 2
chapter: 7
chapterTitle: "图的遍历与应用"
updated: "2026-08-24"
contributors: ["Azen"]
status: "draft"
---

# 7.2 最小生成树与最短路径

连通无向图的最小生成树（MST）用最小总权连接全部顶点且不成环；单源最短路径（SSSP）寻找一个源点到其他顶点的最小代价。它们都使用贪心选择，但目标、状态与正确性前提不同。

## 学习目标

- 解释最小生成树与最短路径不是同一个问题；
- 手算 Prim 与 Kruskal，说明切分安全边与并查集判环的作用；
- 实现非负权图的 Dijkstra，并用反例解释负权限制；
- 根据图的稠密度、表示和操作结构给出准确复杂度；
- 处理不连通、不可达、零权、多重边与距离溢出边界。

## Prim 算法

Prim 从任意顶点开始维护树内集合 `S`，每一步选择连接 `S` 与 `V-S` 的最小权边，把一个新顶点加入树。

::: theorem 结论 · 切分安全边
对连通无向带权图的任意切分，跨越切分的最小权边至少属于某棵 MST。Prim 每轮选取当前树内外切分的最小边，因此选择是安全的。
:::

使用邻接矩阵和线性扫描寻找下一顶点时为 $O(n^2)$；使用邻接表与最小堆时为 $O((n+m)\log n)$。稠密图上矩阵朴素版可能更简单且常数更小，稀疏图上堆版通常更合适。

## Kruskal 算法

Kruskal 把边按权值升序处理：若边两端位于不同连通分量，就选中边并合并分量；若已同组，加边会成环，跳过。

```cpp:line-numbers [kruskal.cpp]
#include <algorithm>
#include <stdexcept>
#include <vector>

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
            ++chosen;
        }
    }
    if (vertexCount > 0 && chosen != vertexCount - 1) {
        throw std::runtime_error("graph is disconnected");
    }
    return total;
}
```

边排序为 $O(m\log m)$；并查集操作总计接近线性，详见[5.4 并查集](../chapter-05-tree-applications/04-disjoint-set-union.md)。不连通图无法产生覆盖所有顶点的一棵生成树，但算法会得到每个分量的最小生成森林。

## Dijkstra 算法

Dijkstra 维护源点到各顶点的当前上界 `dist[]`，每次确定未处理顶点中距离最小者 `u`，再用它的出边执行松弛：

$$
dist[v]\leftarrow\min\{dist[v],\;dist[u]+w(u,v)\}.
$$

```cpp:line-numbers [dijkstra.cpp]
#include <functional>
#include <limits>
#include <queue>
#include <stdexcept>
#include <utility>
#include <vector>

std::vector<long long> dijkstra(const GraphList& graph, int source, int n) {
    if (n < 0 || source < 0 || source >= n) {
        throw std::invalid_argument("invalid source or vertex count");
    }
    const long long infinity = std::numeric_limits<long long>::max() / 4;
    std::vector<long long> distance(n, infinity);
    using State = std::pair<long long, int>;
    std::priority_queue<State, std::vector<State>, std::greater<State>> queue;

    distance[source] = 0;
    queue.push({0, source});
    while (!queue.empty()) {
        auto [knownDistance, u] = queue.top();
        queue.pop();
        if (knownDistance != distance[u]) continue;  // 跳过过期条目

        for (const Edge& edge : graph.neighbors(u)) {
            if (edge.to >= static_cast<std::size_t>(n)) {
                throw std::out_of_range("edge endpoint out of range");
            }
            if (edge.weight < 0) throw std::invalid_argument("negative edge");
            long long candidate = distance[u] + edge.weight;
            if (candidate < distance[edge.to]) {
                distance[edge.to] = candidate;
                queue.push({candidate, static_cast<int>(edge.to)});
            }
        }
    }
    return distance;
}
```

标准 `priority_queue` 没有 decrease-key，这个实现直接插入新距离，出堆时丢弃过期条目。每次成功松弛至多新增一项，堆中最坏可有 $O(m)$ 个条目，因此该代码的严格上界为 $O((n+m)\log m)$，空间为 $O(n+m)$。若使用支持 decrease-key、堆中只保留每个顶点一个条目的二叉堆，实现界为 $O((n+m)\log n)$。

::: warning Dijkstra 要求非负边权
一旦最小距离顶点被确定，算法假设未来绕行不会让它更短。负权边会破坏这一前提。例如 `s->a=2`、`s->b=5`、`b->a=-10`，若先确定 `a=2`，后来经 `b` 可得到 `a=-5`。负权图应使用 Bellman-Ford 等算法；存在可达负环时，最短距离甚至没有有限值。
:::

## 算法选择与边界

| 场景 | 推荐起点 | 典型复杂度 |
| --- | --- | --- |
| 稠密无向图 MST | 朴素 Prim + 矩阵 | $O(n^2)$ |
| 稀疏无向图 MST | Kruskal + DSU 或堆 Prim | $O(m\log m)$ 或 $O((n+m)\log n)$ |
| 非负权单源最短路 | Dijkstra + 最小堆 | $O((n+m)\log n)$ 量级 |
| 稠密非负权最短路 | 朴素 Dijkstra + 矩阵 | $O(n^2)$ |
| 含负权边 | Bellman-Ford 等 | $O(nm)$ |
| 无权最短步数 | BFS | $O(n+m)$ |

::: pitfall 易错点 · MST 路径不等于原图最短路径
MST 最小化整棵树的边权总和，不保证树上任意两点路径在原图中最短。最短路径树也不一定具有最小总边权。目标函数不同，不能互相替代。
:::

## 小结与自测

Prim 与 Kruskal通过切分安全边构造 MST，Dijkstra 通过非负权下的最小暂定距离构造最短路径。选择算法前先明确目标，再检查方向、权值、连通性与存储表示。

1. 为什么 Kruskal 只在两个端点分属不同集合时选边？
2. 稠密图上为什么朴素 Prim 可能比堆实现更合适？
3. 画出一个 MST 路径不是原图最短路径的反例。
4. Dijkstra 的过期堆条目为什么可以直接跳过？
5. 不连通图上 Prim/Kruskal 应报告什么结果？

下一节可通过[7.3 A* 寻路可视化](./03-astar-visualization.md)观察启发式搜索如何改变探索顺序。
