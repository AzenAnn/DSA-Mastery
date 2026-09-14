#include <iostream>
#include <vector>

std::vector<bool> reachable(const std::vector<std::vector<int>>& graph) {
    std::vector<bool> visited(graph.size(), false);
    std::vector<int> pending{1};
    visited[1] = true;
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
    return visited;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n + 1), reversed(n + 1);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        reversed[v].push_back(u);
    }
    auto forward = reachable(graph);
    for (int v = 1; v <= n; ++v) {
        if (!forward[v]) {
            std::cout << "NO\n1 " << v << '\n';
            return 0;
        }
    }
    auto backward = reachable(reversed);
    for (int v = 1; v <= n; ++v) {
        if (!backward[v]) {
            std::cout << "NO\n" << v << " 1\n";
            return 0;
        }
    }
    std::cout << "YES\n";
}
