#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

// TODO: 实现 Floyd-Warshall，回答 q 次点对查询。
// 初始邻接矩阵 d（无边 INF，对角线 0）；nxt[i][j] 记录最短路上 i 的下一跳。
// 要求：
//   1) 建图：多重边取最小；初始化 nxt[i][j] = (i==j || d[i][j]==INF) ? -1 : j；
//   2) 三重循环 k/i/j（k 必须最外层）：
//        若 d[i][k]、d[k][j] 均有限且 d[i][k]+d[k][j] < d[i][j]：
//           d[i][j] = d[i][k]+d[k][j];  nxt[i][j] = nxt[i][k];
//   3) 查询 (s, t)：不可达（nxt[s][t]==-1 且 s!=t）输出 -1；
//      可达则沿 nxt 还原路径并输出 "dist: 路径"。
void floydAllPairs(int n, std::vector<std::vector<long long>>& d,
                   std::vector<std::vector<int>>& nxt) {
    // TODO
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    int q = 0;
    if (!(std::cin >> n >> m >> q)) return 0;

    const long long INF = std::numeric_limits<long long>::max() / 4;
    std::vector<std::vector<long long>> d(n, std::vector<long long>(n, INF));
    std::vector<std::vector<int>> nxt(n, std::vector<int>(n, -1));
    for (int i = 0; i < n; ++i) d[i][i] = 0;

    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        long long w = 0;
        std::cin >> u >> v >> w;
        // TODO: 多重边取最小（自环 w>=0 时自然无害）。
        d[u][v] = w;
        nxt[u][v] = v;
    }

    floydAllPairs(n, d, nxt);

    for (int qi = 0; qi < q; ++qi) {
        int s = 0;
        int t = 0;
        std::cin >> s >> t;
        // TODO: 按规则输出。
    }
    return 0;
}
