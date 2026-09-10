#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

struct Edge {
    int to;
    long long w;
};

// TODO: 实现带 cnt/sum 维护的 Dijkstra。
// 无向图 graph[u] = {Edge{to, w}, ...}（每条无向边已拆成两条有向边）；
// 城市 i 有 c[i] 支救援队。
// 要求：
//   1) dist/cntV/sumV 三个数组，语义见 README；
//   2) 松弛 (u, v, w)：
//        - dist[u]+w < dist[v]：重置 cntV[v]=cntV[u]，sumV[v]=sumV[u]+c[v]；
//        - dist[u]+w == dist[v]：cntV[v]+=cntV[u]，sumV[v]=max(..., sumV[u]+c[v])；
//   3) 输出 cntV[t] 与 sumV[t]。
void emergency(int n, const std::vector<std::vector<Edge>>& graph,
               const std::vector<long long>& c, int s, int t) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    // TODO
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    int s = 0;
    int t = 0;
    if (!(std::cin >> n >> m >> s >> t)) return 0;

    std::vector<long long> c(n);
    for (int i = 0; i < n; ++i) std::cin >> c[i];

    std::vector<std::vector<Edge>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        long long w = 0;
        std::cin >> u >> v >> w;
        // TODO: 无向边拆成两条有向边。
    }

    emergency(n, graph, c, s, t);
    return 0;
}
