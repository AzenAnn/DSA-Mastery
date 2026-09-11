#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<int> degree(n);
    std::vector<std::vector<int>> adjacent(n, std::vector<int>(n));
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        ++degree[u];
        ++degree[v];
        adjacent[u][v] = adjacent[v][u] = 1;
    }
    int answer = 0;
    for (int u = 0; u < n; ++u) {
        for (int v = u + 1; v < n; ++v) {
            answer = std::max(answer, degree[u] + degree[v] - adjacent[u][v]);
        }
    }
    std::cout << answer << '\n';
}
