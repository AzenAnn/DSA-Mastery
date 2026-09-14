#include <iostream>
#include <vector>

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
    std::vector<bool> visited(n + 1, false);
    std::vector<int> representatives;
    for (int start = 1; start <= n; ++start) {
        if (visited[start]) continue;
        representatives.push_back(start);
        std::vector<int> pending{start};
        visited[start] = true;
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
    }
    std::cout << representatives.size() - 1 << '\n';
    for (std::size_t i = 1; i < representatives.size(); ++i) {
        std::cout << representatives[0] << ' ' << representatives[i] << '\n';
    }
}
