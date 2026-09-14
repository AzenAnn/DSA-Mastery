#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n), reversed(n);
    std::vector<std::pair<int, int>> edges;
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        reversed[v].push_back(u);
        edges.emplace_back(u, v);
    }
    std::vector<int> labels(n, 0);
    std::vector<std::pair<int, int>> condensed;
    // TODO: Compute SCCs and canonical labels.
    // TODO: Collect only cross-component edges, sort them, and remove duplicates.
    std::cout << *std::max_element(labels.begin(), labels.end()) << ' ' << condensed.size() << '\n';
    for (int v = 0; v < n; ++v) std::cout << (v ? " " : "") << labels[v];
    std::cout << '\n';
    for (const auto& edge : condensed) std::cout << edge.first << ' ' << edge.second << '\n';
}
