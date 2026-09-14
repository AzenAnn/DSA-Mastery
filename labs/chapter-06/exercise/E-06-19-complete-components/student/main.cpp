#include <iostream>
#include <vector>

int countComplete(const std::vector<std::vector<int>>&) {
    // TODO: Count vertices and edges inside each connected component.
    // TODO: Decide whether every pair is adjacent; include isolated vertices.
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
    std::cout << countComplete(graph) << '\n';
}
