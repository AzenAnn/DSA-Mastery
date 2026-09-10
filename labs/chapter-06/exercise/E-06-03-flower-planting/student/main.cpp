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
        // TODO: 无向路径需要在两个端点的邻接表中分别记录。
    }

    std::vector<int> flower(n, 0);
    for (int garden = 0; garden < n; ++garden) {
        std::array<bool, 5> used{};
        // TODO: 标记当前花园的已染色邻居使用了哪些花种。
        // TODO: 从 1 到 4 选择最小的可用花种。
    }

    for (int garden = 0; garden < n; ++garden) {
        if (garden > 0) std::cout << ' ';
        std::cout << flower[garden];
    }
    std::cout << '\n';
    return 0;
}
