#include <algorithm>
#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

struct Edge {
    int to;
    long long w;
};

void emergency(int n, const std::vector<std::vector<Edge>>& graph,
               const std::vector<long long>& c, int s, int t) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    std::vector<long long> dist(n, INF);
    std::vector<long long> cntV(n, 0);
    std::vector<long long> sumV(n, 0);
    dist[s] = 0;
    cntV[s] = 1;
    sumV[s] = c[s];

    std::vector<bool> done(n, false);
    for (int round = 0; round < n; ++round) {
        int u = -1;
        for (int v = 0; v < n; ++v) {
            if (done[v] || dist[v] >= INF) continue;
            if (u == -1 || dist[v] < dist[u]) u = v;
        }
        if (u == -1) break;
        done[u] = true;
        for (const Edge& e : graph[u]) {
            if (dist[u] + e.w < dist[e.to]) {
                dist[e.to] = dist[u] + e.w;
                cntV[e.to] = cntV[u];
                sumV[e.to] = sumV[u] + c[e.to];
            } else if (dist[u] + e.w == dist[e.to]) {
                cntV[e.to] += cntV[u];
                sumV[e.to] = std::max(sumV[e.to], sumV[u] + c[e.to]);
            }
        }
    }

    std::cout << cntV[t] << ' ' << sumV[t] << '\n';
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
        graph[u].push_back({v, w});
        graph[v].push_back({u, w});
    }

    emergency(n, graph, c, s, t);
    return 0;
}
