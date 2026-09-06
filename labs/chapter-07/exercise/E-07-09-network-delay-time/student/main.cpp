#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

struct Edge {
    int to;
    long long w;
};

// TODO: 实现堆优化 Dijkstra，返回从 s 出发所有节点收齐信号的时间。
//   1) dist 用 INF 初始化，dist[s]=0，小根堆存 (dist, vertex)；
//   2) 弹出时若 d != dist[u] 说明是过期记录，跳过；
//   3) 松弛出边，成功时更新 dist 并入堆；
//   4) 求 max dist：存在 INF 返回 -1，否则返回最大值。
long long networkDelayTime(int n, const std::vector<std::vector<Edge>>& graph, int s) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    // TODO
    return -1;
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

    std::cout << networkDelayTime(n, graph, s) << '\n';
    return 0;
}
