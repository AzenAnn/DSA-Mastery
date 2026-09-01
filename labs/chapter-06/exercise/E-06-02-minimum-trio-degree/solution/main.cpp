#include <algorithm>
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
    for (int a = 0; a < n; ++a) {
        for (int b = a + 1; b < n; ++b) {
            if (!adjacent[a][b]) continue;
            for (int c = b + 1; c < n; ++c) {
                if (adjacent[a][c] && adjacent[b][c]) {
                    answer = std::min(
                        answer, degree[a] + degree[b] + degree[c] - 6);
                }
            }
        }
    }

    if (answer == std::numeric_limits<int>::max()) answer = -1;
    std::cout << answer << '\n';
    return 0;
}
