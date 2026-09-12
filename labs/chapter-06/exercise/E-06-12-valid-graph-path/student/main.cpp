#include <iostream>
#include <vector>

bool pathExists(const std::vector<std::vector<int>>&, int, int) {
    // TODO: Traverse from source and test whether destination is visited.
    // TODO: A vertex can reach itself even without any edge.
    return false;
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
    int source = 0, destination = 0;
    std::cin >> source >> destination;
    std::cout << pathExists(graph, source, destination) << '\n';
}
