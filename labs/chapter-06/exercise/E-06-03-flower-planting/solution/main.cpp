#include <array>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) return 0;

    std::vector<std::vector<int>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }

    std::vector<int> flower(n, 0);
    for (int garden = 0; garden < n; ++garden) {
        std::array<bool, 5> used{};
        for (int neighbor : graph[garden]) {
            if (flower[neighbor] != 0) used[flower[neighbor]] = true;
        }
        for (int kind = 1; kind <= 4; ++kind) {
            if (!used[kind]) {
                flower[garden] = kind;
                break;
            }
        }
    }

    for (int garden = 0; garden < n; ++garden) {
        if (garden > 0) std::cout << ' ';
        std::cout << flower[garden];
    }
    std::cout << '\n';
    return 0;
}
