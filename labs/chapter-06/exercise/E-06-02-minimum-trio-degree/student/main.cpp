#include <iostream>
#include <limits>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) return 0;

    std::vector<std::vector<unsigned char>> adjacent(
        n, std::vector<unsigned char>(n, 0));
    std::vector<int> degree(n, 0);

    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        std::cin >> u >> v;
        adjacent[u][v] = 1;
        adjacent[v][u] = 1;
        ++degree[u];
        ++degree[v];
    }

    int answer = std::numeric_limits<int>::max();
    // TODO: 只枚举 a < b < c 的顶点三元组。
    // TODO: 用邻接矩阵判断三个顶点是否两两相邻。
    // TODO: 用 degree[a] + degree[b] + degree[c] - 6 更新最小值。

    if (answer == std::numeric_limits<int>::max()) answer = -1;
    std::cout << answer << '\n';
    return 0;
}
