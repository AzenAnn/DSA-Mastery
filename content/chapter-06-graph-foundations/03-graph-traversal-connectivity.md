---
title: "6.3 图的遍历与连通性"
description: "从邻接表出发实现 DFS 与 BFS，用完整遍历计算无向连通分量、弱连通分量与强连通分量。"
order: 3
chapter: 6
chapterTitle: "图的基础与存储"
updated: "2026-09-11"
contributors: ["walker2398", "Azen"]
status: "draft"
---

# 6.3 图的遍历与连通性

前两节已经回答了“图由什么组成”以及“怎样把边存进内存”。本节继续回答一个更直接的问题：**给定起点，程序怎样找出沿边能够到达的全部顶点？**

DFS 与 BFS 都能完成这个任务。它们的访问顺序不同，但对连通性问题而言，更重要的是二者最终访问到的**顶点集合**。本节以此为主线：先建立遍历骨架，再用它判断无向连通、弱连通和强连通。

第 7.1 节会继续研究遍历顺序、递归与显式栈的一致性、DFS 时间戳与边分类，以及 BFS 无权最短距离的正确性。本节不重复这些进阶性质，而是聚焦“遍历怎样计算连通性”。

## 学习目标

完成本节后，你应该能够：

- 区分从一个起点进行的单源遍历与覆盖整张图的完整遍历；
- 用邻接表实现基础 DFS 与 BFS，并正确设置 `visited`；
- 用 DFS 或 BFS 判断无向图是否连通并标记所有连通分量；
- 区分有向图的可达、弱连通与强连通；
- 用原图和转置图判断整张有向图是否强连通；
- 说明 Kosaraju 算法为什么能够划分所有强连通分量；
- 根据静态图、增量加边等不同场景选择遍历或并查集。

## 从“枚举邻居”到“遍历图”

沿用 6.2 节的邻接表约定：`graph[u]` 保存从顶点 `u` 可以直接到达的所有邻居。无向边 `{u,v}` 要在 `graph[u]` 和 `graph[v]` 中各保存一条邻接记录；有向边 `u→v` 只写入 `graph[u]`。

遍历需要同时维护两类信息：

1. **已经发现哪些顶点**：由 `visited` 记录，避免顶点因环或多条路径被反复加入；
2. **接下来处理哪些顶点**：DFS 使用栈，BFS 使用队列。

::: definition 定义 · 单源遍历
给定图 $G=(V,E)$ 与起点 $s$，单源遍历访问从 $s$ 可达的全部顶点，并让每个顶点只被正式处理一次。无向图中，结果恰好是 $s$ 所在的连通分量；有向图中，结果是从 $s$ 可达的顶点集合。
:::

“从 `s` 可达”不等于“属于整张图”。如果图不连通，一次单源遍历不会自动跳到其他分量。

### DFS：用栈优先深入

下面的迭代 DFS 在顶点**入栈时**标记。若等到出栈才标记，同一顶点可能在等待期间被多个邻居重复压栈。

```cpp:line-numbers [dfs-reachable.cpp]
#include <stack>
#include <vector>

std::vector<bool> dfs_reachable(
    int start,
    const std::vector<std::vector<int>>& graph
) {
    std::vector<bool> visited(graph.size(), false);
    std::stack<int> pending;

    visited[start] = true;
    pending.push(start);

    while (!pending.empty()) {
        int u = pending.top();
        pending.pop();

        for (int v : graph[u]) {
            if (visited[v]) continue;
            visited[v] = true;
            pending.push(v);
        }
    }
    return visited;
}
```

这段代码只承诺返回正确的可达集合。若题目还要求固定的发现顺序，就必须同时规定邻接表顺序和压栈顺序；第 7.1 节会详细比较迭代 DFS 与递归 DFS 的顺序差异。

### BFS：用队列逐层扩展

把栈换成队列，就得到 BFS。它同样在顶点**入队时**标记，因此每个顶点至多入队一次。

```cpp:line-numbers [bfs-reachable.cpp]
#include <queue>
#include <vector>

std::vector<bool> bfs_reachable(
    int start,
    const std::vector<std::vector<int>>& graph
) {
    std::vector<bool> visited(graph.size(), false);
    std::queue<int> pending;

    visited[start] = true;
    pending.push(start);

    while (!pending.empty()) {
        int u = pending.front();
        pending.pop();

        for (int v : graph[u]) {
            if (visited[v]) continue;
            visited[v] = true;
            pending.push(v);
        }
    }
    return visited;
}
```

DFS 与 BFS 对待访问顶点的调度方式不同，但如果起点和图相同，它们访问到的顶点集合相同。连通性只关心这个集合，不要求二者产生相同的访问顺序或搜索树。

::: complexity 复杂度 · 一次单源遍历
邻接表中，每个可达顶点至多进入栈或队列一次，每条与可达顶点关联的邻接记录至多扫描一次。若用整图规模表示，上界为时间 $O(n+m)$、辅助空间 $O(n)$。

邻接矩阵必须为每个已访问顶点扫描一整行来寻找邻居，完整遍历的时间为 $O(n^2)$。这正是图的存储方式会改变遍历成本的原因。
:::

## 完整遍历与搜索森林

要覆盖一张可能不连通的无向图，应按固定顺序扫描所有顶点；每遇到一个尚未访问的顶点，就从它启动一次新的 DFS 或 BFS。

```text [full-traversal.txt]
visited = 全 false
for u = 0 .. n-1:
    if u 尚未访问:
        从 u 启动一次 DFS/BFS
```

每次新启动的搜索生成一棵搜索树。连通图只生成一棵树；非连通图会生成多棵树，合起来称为**搜索森林**。因此不能用“完整遍历最终是否访问全部顶点”判断连通——完整遍历按定义总会覆盖全部顶点；应当判断它一共启动了多少次搜索。

## 无向图的连通分量

在无向图中，“存在路径”具有对称性：如果 `u` 能到达 `v`，那么把路径反向走就能从 `v` 回到 `u`。所有顶点因此被划分为若干个互不重叠的最大可达集合，也就是连通分量。

下面用 BFS 给每个顶点写入分量编号。外层按 `0..n-1` 扫描，因此包含最小未标号顶点的分量会先获得编号。

```cpp:line-numbers [connected-components.cpp]
#include <queue>
#include <vector>

int label_components(
    const std::vector<std::vector<int>>& graph,
    std::vector<int>& component
) {
    int n = static_cast<int>(graph.size());
    component.assign(n, -1);
    int count = 0;

    for (int start = 0; start < n; ++start) {
        if (component[start] != -1) continue;

        std::queue<int> pending;
        component[start] = count;
        pending.push(start);

        while (!pending.empty()) {
            int u = pending.front();
            pending.pop();

            for (int v : graph[u]) {
                if (component[v] != -1) continue;
                component[v] = count;
                pending.push(v);
            }
        }
        ++count;
    }
    return count;
}
```

若顶点集非空，返回值为 `1` 当且仅当无向图连通。没有边的孤立顶点仍会触发一次搜索，所以它单独构成一个连通分量。

::: example 示例 · 为什么只从 0 出发不够
设无向图的边集为

$$
E=\{\{0,1\},\{1,2\},\{3,4\}\},
$$

并另有孤立顶点 $5$。从 $0$ 出发只会访问 $\{0,1,2\}$。完整扫描会依次从 $0$、$3$、$5$ 启动三次搜索，得到三个分量：

$$
\{0,1,2\},\quad \{3,4\},\quad \{5\}.
$$
:::

将代码中的队列替换为 DFS，并不会改变分量划分；只有分量内部的访问顺序可能变化。

## 有向图：可达不再对称

有向图中，`u` 可达 `v` 不保证 `v` 可达 `u`。因此不能直接把无向图的“互相连通”原样套用，而要先明确问题采用哪一种连通标准。

### 弱连通

忽略所有边的方向后，如果底层无向图连通，就称原有向图**弱连通**。划分弱连通分量时，可以建立一个无向邻接表：对每条有向边 `u→v`，同时加入邻接记录 `u-v` 与 `v-u`，再运行无向连通分量算法。

弱连通只说明顶点在忽略方向后属于同一块，不保证任意方向都能沿有向边到达。例如 `0→1→2` 弱连通，但 `2` 不能到达 `0`。

### 判断整张图是否强连通

如果任意两个顶点都互相可达，则有向图**强连通**。只从某个起点 `s` 在原图上访问到全部顶点还不够：这只能证明 `s` 能到达所有顶点，不能证明所有顶点都能回到 `s`。

令 $G^T$ 为把 $G$ 的每条边反向后得到的**转置图**。任选顶点 $s$，分别执行：

1. 在 $G$ 中从 $s$ 遍历，检查 $s$ 是否能到达所有顶点；
2. 在 $G^T$ 中从 $s$ 遍历，检查 $s$ 是否能到达所有顶点。

第二项等价于检查原图中每个顶点是否都能到达 $s$。两项都成立时，对任意 $u,v$，原图中存在路径 $u\leadsto s\leadsto v$，所以整张图强连通；任一项失败则不强连通。两次遍历和构造转置图的总时间都是 $O(n+m)$。

## 划分强连通分量：Kosaraju 算法

整张图不强连通时，还可以把顶点划分成若干个**强连通分量**（Strongly Connected Components，SCC）：每个分量内部任意两点互相可达，并且无法再加入其他顶点而保持这一性质。

把每个 SCC 缩成一个顶点，并保留分量之间的边，得到的图称为**凝聚图**。凝聚图一定是 DAG；如果其中存在有向环，环上的分量本来就互相可达，应当合并为同一个 SCC。

Kosaraju 算法使用两轮 DFS：

1. 在原图 $G$ 上做完整 DFS，顶点完成时加入 `finish_order`；
2. 构造转置图 $G^T$，按完成时间从大到小扫描顶点；每遇到未标号顶点，就在 $G^T$ 上启动 DFS 并标为同一个 SCC。

下面代码使用递归突出两轮搜索的结构：

```cpp:line-numbers [kosaraju.cpp]
#include <algorithm>
#include <vector>

void collect_finish_order(
    int u,
    const std::vector<std::vector<int>>& graph,
    std::vector<bool>& visited,
    std::vector<int>& finish_order
) {
    visited[u] = true;
    for (int v : graph[u]) {
        if (!visited[v]) {
            collect_finish_order(v, graph, visited, finish_order);
        }
    }
    finish_order.push_back(u); // 所有后继处理完成后记录
}

void assign_component(
    int u,
    int id,
    const std::vector<std::vector<int>>& reversed,
    std::vector<int>& component
) {
    component[u] = id;
    for (int v : reversed[u]) {
        if (component[v] == -1) {
            assign_component(v, id, reversed, component);
        }
    }
}

std::vector<int> kosaraju(
    const std::vector<std::vector<int>>& graph
) {
    int n = static_cast<int>(graph.size());
    std::vector<std::vector<int>> reversed(n);
    for (int u = 0; u < n; ++u) {
        for (int v : graph[u]) reversed[v].push_back(u);
    }

    std::vector<bool> visited(n, false);
    std::vector<int> finish_order;
    finish_order.reserve(n);
    for (int u = 0; u < n; ++u) {
        if (!visited[u]) {
            collect_finish_order(u, graph, visited, finish_order);
        }
    }

    std::reverse(finish_order.begin(), finish_order.end());
    std::vector<int> component(n, -1);
    int count = 0;
    for (int u : finish_order) {
        if (component[u] != -1) continue;
        assign_component(u, count, reversed, component);
        ++count;
    }
    return component;
}
```

::: warning 递归深度
代码使用递归是为了清楚呈现“进入顶点”和“完成顶点”两个时机。长链图可能使递归深度达到 $O(n)$；处理大图时应改写为保存“顶点 + 下一个邻居下标”的显式栈。只用一个顶点栈批量压入邻居，无法直接模拟完成时间。
:::

### 为什么第二轮不会串到别的分量

考虑原图的凝聚 DAG。第一轮尚未归入结果的 SCC 中，完成时间最大的顶点属于一个没有未处理前驱的 SCC。转置后，分量间的边全部反向，这个 SCC 不会沿转置边进入另一个未处理 SCC；但其内部顶点仍然互相可达。因此第二轮从该顶点出发，恰好收集整个 SCC，不会多收也不会漏收。重复这一过程即可得到全部分量。

Kosaraju 构造转置图并进行两次完整 DFS，时间为 $O(n+m)$，额外空间为 $O(n+m)$。Tarjan 算法可以在一轮 DFS 中得到 SCC，但需要额外维护发现次序、`low` 值和栈内状态；本节先掌握更容易核验的两遍结构。

## 方法选择

| 问题 | 合适方法 | 关键判断 |
| --- | --- | --- |
| 求从固定起点可达的顶点 | 一次 DFS 或 BFS | 只覆盖起点可达集合 |
| 判断非空无向图是否连通 | 从任一点做一次 DFS/BFS | 是否访问全部顶点 |
| 标记无向连通分量 | 外层扫描 + DFS/BFS | 启动一次搜索得到一个分量 |
| 标记有向弱连通分量 | 忽略方向后做无向分量划分 | 不保留方向可达语义 |
| 判断整张有向图是否强连通 | 在 $G$ 与 $G^T$ 各遍历一次 | 同时检查“从 $s$ 出发”和“回到 $s$” |
| 标记全部强连通分量 | Kosaraju 或 Tarjan | 需要保留方向信息 |
| 只增边且频繁查询无向连通性 | 并查集 | 不需要恢复具体路径 |

最后一行属于第 5.4 节的[并查集](../chapter-05-tree-applications/04-disjoint-set-union.md)：它适合维护不断合并的无向集合，但不能替代有向图 SCC 算法，也不擅长处理删除边后的动态连通性。

## 常见错误

::: pitfall 易错点 · 把一次遍历当作完整遍历
从顶点 `0` 出发只访问到一个分量。需要覆盖全图时，必须在外层扫描所有尚未访问的顶点。
:::

::: pitfall 易错点 · 出栈或出队时才标记
延迟标记会让同一顶点被多个邻居重复加入待处理结构。应在首次发现、即入栈或入队时标记。
:::

::: pitfall 易错点 · 用一次正向遍历判断强连通
从 `s` 能到达所有顶点只证明单向可达。还必须在转置图中从 `s` 再检查一次，确认所有顶点在原图中都能回到 `s`。
:::

::: pitfall 易错点 · 把弱连通分量当作 SCC
忽略方向会丢失可达方向。弱连通分量可能包含多个 SCC，不能用同一套标签回答两类问题。
:::

::: pitfall 易错点 · 把访问顺序当作分量定义
邻居顺序可能改变 DFS/BFS 的访问序列和搜索树，但不会改变可达集合、无向连通分量或 SCC 的数学划分。
:::

## 与第 7 章的分工

本节回答的是：

- 一次搜索覆盖哪些顶点；
- 怎样覆盖非连通图；
- 怎样由遍历得到连通分量、弱连通分量和强连通分量。

[第 7.1 节 图的遍历：DFS 与 BFS](../chapter-07-graph-traversal/01-dfs-and-bfs.md)在此基础上继续回答：

- 固定邻居顺序后，DFS 与 BFS 分别按什么顺序访问；
- 递归 DFS 与显式栈 DFS 怎样保持一致；
- 发现时间、完成时间和 DFS 边分类能证明什么；
- 为什么 BFS 能给出无权图最短距离；
- 怎样用遍历检测环和判断二分图。

这种分工避免重复：第六章负责“存储之上的可达性与连通划分”，第七章负责“遍历顺序的性质及其算法应用”。

## 练习与自测

### 1. 单源遍历与完整遍历

无向图有顶点 $\{0,1,2,3,4,5\}$，边为 $\{0,1\}$、$\{1,2\}$、$\{3,4\}$。从 $0$ 出发一次 BFS 会访问哪些顶点？完整遍历会启动几次搜索？

::: details 点击展开答案
一次 BFS 访问 $\{0,1,2\}$。完整遍历按编号扫描时分别从 $0$、$3$、$5$ 启动搜索，共三次，对应三个连通分量 $\{0,1,2\}$、$\{3,4\}$、$\{5\}$。
:::

### 2. DFS 与 BFS 会不会得到不同分量

在同一无向图上，用 DFS 和 BFS 运行 `label_components`，分量内部访问顺序不同。最终分量划分是否可能不同？

::: details 点击展开答案
不会。两种算法都会沿边访问起点可达的全部顶点，所以每次搜索覆盖同一个连通分量。外层起点扫描规则相同时，分量编号也相同；只有分量内部的访问顺序和搜索树可能不同。
:::

### 3. 一次遍历为什么不能证明强连通

有向图只有边 $0\to1$、$1\to2$。从 $0$ 出发可以访问全部顶点。它是否强连通？转置图上的第二次检查会在哪里失败？

::: details 点击展开答案
不强连通，因为 $1$、$2$ 都不能回到 $0$。转置图包含 $1\to0$、$2\to1$；从 $0$ 出发没有出边，只能访问 $0$，因此第二次检查失败。
:::

### 4. 弱连通分量与 SCC

有向图边为 $0\to1$、$1\to0$、$1\to2$、$2\to3$、$3\to2$。写出弱连通分量和强连通分量。

::: details 点击展开答案
忽略方向后四个顶点连成一体，所以只有一个弱连通分量 $\{0,1,2,3\}$。强连通分量有两个：$\{0,1\}$ 与 $\{2,3\}$。边 $1\to2$ 只允许从前一个 SCC 到后一个 SCC，不能反向返回。
:::

### 5. 为什么凝聚图一定无环

假设把 SCC 缩点后得到的图仍有一个有向环，会与 SCC 的“最大互相可达集合”定义产生什么矛盾？

::: details 点击展开答案
缩点后的环意味着环上任意一个分量都能沿环到达其他分量并最终返回，因此这些分量中的任意顶点彼此可达。它们本应合并成一个更大的 SCC，与已经是最大互相可达集合矛盾。
:::

### 6. 遍历还是并查集

一张无向图最初没有边，之后只有“加入一条边”和“询问两点是否连通”两类操作。每次询问都重新 DFS 是否合适？

::: details 点击展开答案
可以得到正确答案，但每次查询最坏需要 $O(n+m)$。只增边时更适合并查集：加入边执行 `unite`，查询执行 `find`，配合路径压缩与按大小合并后，均摊成本接近常数。若还要输出实际路径，仍需保存图并运行遍历；并查集只维护分组关系。
:::

## 实践入口

- [Lab 06-T-03：图的遍历与连通性选择题精练](../../labs/chapter-06/theory/T-06-03-graph-traversal-connectivity/README.md)：检查单源与完整遍历、弱连通、强连通和 Kosaraju；
- [Lab 06-T-04：图基础综合理论大题训练](../../labs/chapter-06/theory/T-06-04-graph-foundations-written/README.md)：用 12 道书面题强化表示转换、遍历不变量、正确性证明与方法选型；
- [Lab 07-E-02：连通分量计数](../../labs/chapter-07/exercise/E-07-02-connected-components/README.md)：实现无向图完整遍历和分量标号；
- [Lab 07-E-05：显式栈 DFS](../../labs/chapter-07/exercise/E-07-05-iterative-dfs/README.md)：处理大规模深图并核对访问顺序；
- [Lab 05-E-13：动态连通性查询](../../labs/chapter-05/exercise/E-05-13-dynamic-connectivity/README.md)：比较遍历与并查集的适用边界。

## 参考资料

- Cormen 等，《Introduction to Algorithms》，第 22 章：基本图算法与强连通分量；
- 严蔚敏、吴伟民，《数据结构（C 语言版）》：图的遍历与连通分量；
- OpenDSA，[Graph Traversals](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/GraphTraversal.html)。
