#include <iostream>
#include <vector>

long long countPairs(const std::vector<std::vector<int>>&) {
    // TODO: Find component sizes and count unordered pairs across components.
    // TODO: Promote products to 64-bit before multiplying.
    return 0;
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
    std::cout << countPairs(graph) << '\n';
}
