#include <algorithm>
#include <iostream>
#include <vector>

std::vector<int> labelScc(const std::vector<std::vector<int>>& graph,
                          const std::vector<std::vector<int>>&) {
    std::vector<int> labels(graph.size(), 0);
    // TODO: Find SCCs using exit order and traversal on the reversed graph.
    // TODO: Renumber components by their minimum vertex, starting at 1.
    return labels;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n), reversed(n);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        --u; --v;
        graph[u].push_back(v);
        reversed[v].push_back(u);
    }
    auto labels = labelScc(graph, reversed);
    std::cout << *std::max_element(labels.begin(), labels.end()) << '\n';
    for (int v = 0; v < n; ++v) std::cout << (v ? " " : "") << labels[v];
    std::cout << '\n';
}
