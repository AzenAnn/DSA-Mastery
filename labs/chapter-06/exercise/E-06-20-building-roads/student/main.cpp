#include <iostream>
#include <utility>
#include <vector>

std::vector<std::pair<int, int>> newRoads(const std::vector<std::vector<int>>&) {
    // TODO: Find the minimum-numbered vertex of every component.
    // TODO: Connect the smallest representative to each remaining one in order.
    return {};
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n + 1);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    auto roads = newRoads(graph);
    std::cout << roads.size() << '\n';
    for (const auto& edge : roads) std::cout << edge.first << ' ' << edge.second << '\n';
}
