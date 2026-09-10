#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

struct Edge {
    int to;
    long long w;
};

// TODO: 实现朴素 O(n^2) Dijkstra。
// 图用邻接表 graph[u] = {Edge{to, w}, ...} 表示；s 为源点。
// 要求：
//   1) dist[i]：最短距离，不可达时保持 INF（调用方负责转成 -1）；
//   2) prevV[i]：最短路径上的前驱，源点与不可达顶点为 -1；
//   3) order：按"被确定"先后顺序记录可达顶点，源点第一个；
//   4) 每轮在未确定且 dist 有限的顶点中选 dist 最小者，并列取编号最小。
void dijkstra(int n, const std::vector<std::vector<Edge>>& graph, int s,
              std::vector<long long>& dist, std::vector<int>& prevV,
              std::vector<int>& order) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    dist.assign(n, INF);
    prevV.assign(n, -1);
    order.clear();
    dist[s] = 0;

    // 1) done[] 标记已确定顶点；
    // 2) 循环至多 n 次：线性扫描选"未确定且 dist 最小"的顶点 u（并列编号最小）；
    //    选不出则提前结束；
    // 3) 标记 done，记录 order，对 u 的每条出边执行松弛（严格小于）。
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

    // TODO: 输出三行：
    //   1) n 个 dist（不可达输出 -1）；
    //   2) n 个 prev（源点与不可达输出 -1）；
    //   3) 确定顺序（可达顶点编号）。

    return 0;
}
