#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

struct Edge {
    int u;
    int v;
    long long w;
};

bool bellmanFord(int n, const std::vector<Edge>& edges, int s,
                 std::vector<long long>& dist, std::vector<int>& prevV) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    dist.assign(n, INF);
    prevV.assign(n, -1);
    dist[s] = 0;

    auto relax = [&](int round) {
        bool changed = false;
        for (const Edge& e : edges) {
            if (dist[e.u] >= INF) continue;  // 无穷不参与运算，防溢出
            if (dist[e.u] + e.w < dist[e.v]) {
                dist[e.v] = dist[e.u] + e.w;
                prevV[e.v] = e.u;
                changed = true;
            }
        }
        return changed;
    };

    for (int i = 1; i < n; ++i) relax(i);
    return relax(n);  // 第 n 轮仍能松弛 => 从 s 可达的负环
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    int s = 0;
    if (!(std::cin >> n >> m >> s)) return 0;

    std::vector<Edge> edges(m);
    for (int i = 0; i < m; ++i) {
        std::cin >> edges[i].u >> edges[i].v >> edges[i].w;
    }

    std::vector<long long> dist;
    std::vector<int> prevV;
    if (bellmanFord(n, edges, s, dist, prevV)) {
        std::cout << "NEGATIVE CYCLE\n";
    } else {
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
    }
    return 0;
}
