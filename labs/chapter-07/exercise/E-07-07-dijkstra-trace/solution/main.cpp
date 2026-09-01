#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

struct Edge {
    int to;
    long long w;
};

void dijkstra(int n, const std::vector<std::vector<Edge>>& graph, int s,
              std::vector<long long>& dist, std::vector<int>& prevV,
              std::vector<int>& order) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    dist.assign(n, INF);
    prevV.assign(n, -1);
    order.clear();
    dist[s] = 0;

    std::vector<bool> done(n, false);
    for (int round = 0; round < n; ++round) {
        int u = -1;
        for (int v = 0; v < n; ++v) {
            if (done[v] || dist[v] >= INF) continue;
            if (u == -1 || dist[v] < dist[u]) u = v;  // 严格小于：并列保留编号更小者
        }
        if (u == -1) break;  // 剩余顶点全部不可达
        done[u] = true;
        order.push_back(u);
        for (const Edge& e : graph[u]) {
            if (dist[u] + e.w < dist[e.to]) {
                dist[e.to] = dist[u] + e.w;
                prevV[e.to] = u;
            }
        }
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    int s = 0;
    if (!(std::cin >> n >> m >> s)) return 0;

    std::vector<std::vector<Edge>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        long long w = 0;
        std::cin >> u >> v >> w;
        graph[u].push_back({v, w});
    }

    std::vector<long long> dist;
    std::vector<int> prevV;
    std::vector<int> order;
    dijkstra(n, graph, s, dist, prevV, order);

    for (int i = 0; i < n; ++i) {
        if (i) std::cout << ' ';
        std::cout << (dist[i] >= std::numeric_limits<long long>::max() / 4 ? -1 : dist[i]);
    }
    std::cout << '\n';

    for (int i = 0; i < n; ++i) {
        if (i) std::cout << ' ';
        std::cout << prevV[i];
    }
    std::cout << '\n';

    for (size_t i = 0; i < order.size(); ++i) {
        if (i) std::cout << ' ';
        std::cout << order[i];
    }
    std::cout << '\n';
    return 0;
}
