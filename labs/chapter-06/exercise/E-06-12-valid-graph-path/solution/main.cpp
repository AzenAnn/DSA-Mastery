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
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    int source = 0, destination = 0;
    std::cin >> source >> destination;
    std::vector<bool> visited(n, false);
    std::vector<int> pending{source};
    visited[source] = true;
    while (!pending.empty()) {
        int u = pending.back();
        pending.pop_back();
        for (int v : graph[u]) {
            if (!visited[v]) {
                visited[v] = true;
                pending.push_back(v);
            }
        }
    }
    std::cout << visited[destination] << '\n';
}
