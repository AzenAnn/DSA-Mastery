#include <algorithm>
#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

void solveQueries(int n, const std::vector<std::vector<long long>>& adj, int s,
                  const std::vector<int>& targets) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    std::vector<long long> dist(n, INF);
    std::vector<int> prevV(n, -1);
    dist[s] = 0;

    std::vector<bool> done(n, false);
    for (int round = 0; round < n; ++round) {
        int u = -1;
        for (int v = 0; v < n; ++v) {
            if (done[v] || dist[v] >= INF) continue;
            if (u == -1 || dist[v] < dist[u]) u = v;
        }
        if (u == -1) break;
        done[u] = true;
        for (int v = 0; v < n; ++v) {
            if (adj[u][v] >= INF) continue;
            if (dist[u] + adj[u][v] < dist[v]) {
                dist[v] = dist[u] + adj[u][v];
                prevV[v] = u;
            }
        }
    }

    for (int t : targets) {
        if (dist[t] >= INF) {
            std::cout << -1 << '\n';
            continue;
        }
        std::vector<int> path;
        for (int cur = t; cur != -1; cur = prevV[cur]) path.push_back(cur);
        std::reverse(path.begin(), path.end());
        std::cout << dist[t] << ':';
        for (int v : path) std::cout << ' ' << v;
        std::cout << '\n';
    }
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
        if (u == v) continue;  // 自环忽略
        adj[u][v] = std::min(adj[u][v], w);  // 多重边取最小
    }

    std::vector<int> targets(q);
    for (int i = 0; i < q; ++i) std::cin >> targets[i];

    solveQueries(n, adj, s, targets);
    return 0;
}
