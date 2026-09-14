#include <algorithm>
#include <iostream>
#include <vector>

std::vector<int> weakComponents(const std::vector<std::vector<int>>& graph) {
    std::vector<int> labels(graph.size(), 0);
    // TODO: Build the underlying undirected graph and label its components.
    // TODO: Use canonical labels ordered by each component's smallest vertex.
    return labels;
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
    }
    auto labels = weakComponents(graph);
    std::cout << *std::max_element(labels.begin(), labels.end()) << '\n';
    for (int v = 0; v < n; ++v) std::cout << (v ? " " : "") << labels[v];
    std::cout << '\n';
}
