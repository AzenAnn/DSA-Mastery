#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

struct Edge {
    int u;
    int v;
    long long w;
};

// TODO: 实现 Bellman-Ford + 负环检测。
// edges 为边表；s 为源点。
// 要求：
//   1) 初始化 dist[s]=0，其余 INF；
//   2) 松弛 n-1 轮，维护 prevV；
//   3) 第 n 轮再扫全部边：若仍能松弛，返回 true（存在从 s 可达的负环）；
//   4) 调用方在 true 时输出 "NEGATIVE CYCLE"。
// 注意：每次计算 dist[e.u] + e.w 前，必须先确认 dist[e.u] != INF。
bool bellmanFord(int n, const std::vector<Edge>& edges, int s,
                 std::vector<long long>& dist, std::vector<int>& prevV) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    // TODO
    return false;
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
        // TODO: 输出 dist（不可达 -1）与 prevV（源点/不可达 -1）。
    }
    return 0;
}
