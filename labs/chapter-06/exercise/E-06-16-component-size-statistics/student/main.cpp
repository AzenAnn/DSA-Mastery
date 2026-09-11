#include <iostream>
#include <vector>

std::vector<int> componentSizes(const std::vector<std::vector<int>>&) {
    // TODO: Count each component once, then sort all sizes in nonincreasing order.
    return {};
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    auto sizes = componentSizes(graph);
    std::cout << sizes.size() << '\n';
    for (std::size_t i = 0; i < sizes.size(); ++i) std::cout << (i ? " " : "") << sizes[i];
    std::cout << '\n';
}
