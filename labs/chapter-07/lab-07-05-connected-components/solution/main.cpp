#include <algorithm>
#include <iostream>
#include <vector>

void dfs(int u, const std::vector<std::vector<int>>& graph,
         std::vector<int>& comp, int id) {
    comp[u] = id;
    for (int v : graph[u]) {
        if (comp[v] == -1) dfs(v, graph, comp, id);
    }
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

    std::vector<int> comp(n, -1);
    int k = 0;
    for (int v = 0; v < n; ++v) {
        if (comp[v] == -1) dfs(v, graph, comp, k++);
    }

    std::cout << k << '\n';
    for (int u = 0; u < n; ++u) {
        if (u > 0) std::cout << ' ';
        std::cout << comp[u];
    }
    std::cout << '\n';
    return 0;
}
