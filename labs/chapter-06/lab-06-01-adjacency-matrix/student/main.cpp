#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) return 0;

    std::vector<std::vector<int>> matrix(n, std::vector<int>(n, 0));
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        std::cin >> u >> v;
        // TODO: 在邻接矩阵中记录无向边 (u, v)。
    }

    for (int u = 0; u < n; ++u) {
        for (int v = 0; v < n; ++v) {
            if (v > 0) std::cout << ' ';
            std::cout << matrix[u][v];
        }
        std::cout << '\n';
    }

    for (int u = 0; u < n; ++u) {
        if (u > 0) std::cout << ' ';
        int degree = 0;
        // TODO: 计算顶点 u 的度。
        std::cout << degree;
    }
    std::cout << '\n';
    return 0;
}
