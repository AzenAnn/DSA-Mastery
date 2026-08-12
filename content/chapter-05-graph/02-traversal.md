---
title: "5.2 图的遍历"
description: "DFS 与 BFS 的实现、复杂度与适用场景，以及非连通图的处理。"
order: 2
chapter: 5
chapterTitle: "图"
updated: "2026-08-12"
contributors: ["Azen"]
status: "draft"
---

# 5.2 图的遍历

遍历图意味着访问每个顶点恰好一次。与树的遍历不同，图存在**回路**与**非连通分量**，必须用一个"已访问"标记避免无限循环与重复访问。

## 学习目标

- 实现 DFS（递归或栈）与 BFS（队列）；
- 处理非连通图：外层循环保证每个连通分量都被访问；
- 分析两种遍历的时间与空间复杂度；
- 说出 DFS 与 BFS 各自适合解决的问题类型。

## DFS：深度优先

从起点出发，访问一个顶点后**立刻深入**它的第一个未访问邻居，递归地进行；走不通时回溯。递归实现即"在访问时标记，再对每个邻居递归"。

```cpp:line-numbers [dfs.cpp]
void dfs(const GraphList& g, int u, std::vector<bool>& visited) {
    visited[u] = true;                     // 先标记再深入
    for (auto [v, w] : g.neighbors(u))
        if (!visited[v]) dfs(g, v, visited);
}
```

若图可能非连通，在外层遍历所有顶点，未访问则从它开始 DFS：

```cpp:line-numbers [dfs-forest.cpp]
std::vector<bool> visited(n, false);
int components = 0;
for (int u = 0; u < n; ++u) {
    if (!visited[u]) { ++components; dfs(g, u, visited); }   // 每个连通分量一次
}
```

## BFS：广度优先

BFS 用队列**逐层扩散**：先访问起点，把它的所有邻居入队；之后每次出队一个顶点，访问并把它的未访问邻居入队。第 2 章"队列用于广度优先"的预告在这里兑现。

```cpp:line-numbers [bfs.cpp]
void bfs(const GraphList& g, int start, std::vector<int>& dist) {
    std::queue<int> q;
    q.push(start);
    dist[start] = 0;                       // 入队时标记并记录距离
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (auto [v, w] : g.neighbors(u))
            if (dist[v] == -1) {           // 未访问
                dist[v] = dist[u] + 1;
                q.push(v);
            }
    }
}
```

对无权图，BFS 第一次到达顶点时的距离就是**最短路径长度**——"先来先处理"保证按距离递增的顺序发现顶点。

::: warning 入队时标记 vs 出队时标记
BFS 必须在**入队时**标记已访问。若出队时才标记，同一个顶点可能被多个邻居重复入队，破坏复杂度并可能算错距离。
:::

## 复杂度

两种遍历都以邻接表存储为前提：

$$
\text{DFS / BFS} = O(n + m),
$$

每个顶点入栈/入队一次（`O(n)`），每条边被扫描一次（`O(m)`）。若用邻接矩阵，需要 `O(n²)`。

## DFS 与 BFS 的适用场景

| 问题 | 选择 |
| --- | --- |
| 判断连通性、找连通分量 | 两者均可 |
| 找无权图最短路径 | BFS（距离逐层递增） |
| 拓扑排序、检测环、深搜回溯 | DFS |
| 遍历顺序要求"先到先得" | BFS |

## 小结

图遍历的核心是"标记 + 顺序"：标记保证每个顶点只处理一次，顺序（栈还是队列）决定深度优先还是广度优先。连通分量计数、最短路径、拓扑排序等大量问题都以这两种遍历为骨架。

## 练习

1. 为什么 BFS 必须先标记再入队？给出反例说明后果。
2. 用 DFS 对一张无向图判断是否存在环，说明为什么需要"父节点特判"。
3. 非连通图遍历时，外层循环为什么能恰好计数连通分量？
4. 对同一张图分别用邻接矩阵和邻接表实现 BFS，复杂度分别是多少？
