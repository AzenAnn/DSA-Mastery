#include <algorithm>
#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>

void floydAllPairs(int n, std::vector<std::vector<long long>>& d,
                   std::vector<std::vector<int>>& nxt) {
    for (int k = 0; k < n; ++k)  // k 必须最外层
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                if (d[i][k] < std::numeric_limits<long long>::max() / 4 &&
                    d[k][j] < std::numeric_limits<long long>::max() / 4 &&
                    d[i][k] + d[k][j] < d[i][j]) {
                    d[i][j] = d[i][k] + d[k][j];
                    nxt[i][j] = nxt[i][k];
                }
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
        if (w < d[u][v]) {
            d[u][v] = w;
            nxt[u][v] = v;
        }
    }

    floydAllPairs(n, d, nxt);

    for (int qi = 0; qi < q; ++qi) {
        int s = 0;
        int t = 0;
        std::cin >> s >> t;
        if (s == t) {
            std::cout << "0: " << s << '\n';
            continue;
        }
        if (d[s][t] >= INF || nxt[s][t] == -1) {
            std::cout << -1 << '\n';
            continue;
        }
        std::cout << d[s][t] << ':';
        for (int u = s; u != t; u = nxt[u][t]) std::cout << ' ' << u;
        std::cout << ' ' << t << '\n';
    }
    return 0;
}
