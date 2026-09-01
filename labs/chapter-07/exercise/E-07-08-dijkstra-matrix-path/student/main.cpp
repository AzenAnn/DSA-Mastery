#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

// TODO: 实现朴素 O(n^2) Dijkstra，并回答 q 个路径查询。
// 邻接矩阵 adj[u][v]：u->v 的边权，无边为 INF；源点 s。
// 要求：
//   1) 建图时自环忽略，多重边取最小权；
//   2) dist/prevV 语义与 Lab 07-10 一致；
//   3) 对每个查询目标 t：
//        - dist[t] 为无穷 -> 输出 -1；
//        - t == s -> 输出 "0: s"；
//        - 否则沿 prevV 回溯到 s，反转后输出 "dist: 路径"。
void solveQueries(int n, const std::vector<std::vector<long long>>& adj, int s,
                  const std::vector<int>& targets) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    std::vector<long long> dist(n, INF);
    std::vector<int> prevV(n, -1);
    dist[s] = 0;

    // 1) 朴素选点：每轮选未确定且 dist 最小的顶点，并列取编号最小；
    // 2) 松弛 adj[u][v]（严格小于）；
    // 3) 对 targets 逐个回溯并输出。
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    int q = 0;
    int s = 0;
    if (!(std::cin >> n >> m >> q >> s)) return 0;

    const long long INF = std::numeric_limits<long long>::max() / 4;
    std::vector<std::vector<long long>> adj(n, std::vector<long long>(n, INF));

    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        long long w = 0;
        std::cin >> u >> v >> w;
        // TODO: 自环忽略，多重边取最小。
    }

    std::vector<int> targets(q);
    for (int i = 0; i < q; ++i) std::cin >> targets[i];

    solveQueries(n, adj, s, targets);
    return 0;
}
