#include <algorithm>
#include <iostream>
#include <vector>

void dfs(int u, const std::vector<std::vector<int>>& graph,
         std::vector<bool>& visited, std::vector<int>& d, std::vector<int>& f,
         int& timer) {
    visited[u] = true;
    d[u] = ++timer;
    for (int v : graph[u]) {
        if (!visited[v]) dfs(v, graph, visited, d, f, timer);
    }
    f[u] = ++timer;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) return 0;

    std::vector<std::vector<int>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    for (auto& neighbors : graph) std::sort(neighbors.begin(), neighbors.end());

    std::vector<bool> visited(n, false);
    std::vector<int> d(n, 0);
    std::vector<int> f(n, 0);
    int timer = 0;
    for (int v = 0; v < n; ++v) {
        if (!visited[v]) dfs(v, graph, visited, d, f, timer);
    }

    for (int u = 0; u < n; ++u) {
        if (u > 0) std::cout << ' ';
        std::cout << d[u];
    }
    std::cout << '\n';

    for (int u = 0; u < n; ++u) {
        if (u > 0) std::cout << ' ';
        std::cout << f[u];
    }
    std::cout << '\n';
    return 0;
}
