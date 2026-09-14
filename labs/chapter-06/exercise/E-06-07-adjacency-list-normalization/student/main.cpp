#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        // TODO: Add both adjacency records using 1-based vertex labels.
    }
    for (auto& neighbors : graph) {
        // TODO: Normalize the neighbor order before printing.
        std::cout << neighbors.size();
        for (int v : neighbors) std::cout << ' ' << v;
        std::cout << '\n';
    }
}
