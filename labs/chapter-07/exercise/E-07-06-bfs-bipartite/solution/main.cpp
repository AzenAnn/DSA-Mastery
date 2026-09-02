#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>

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

    std::vector<int> color(n, -1);
    std::queue<int> pending;
    for (int root = 0; root < n; ++root) {
        if (color[root] != -1) continue;
        color[root] = 0;
        pending.push(root);
        while (!pending.empty()) {
            const int u = pending.front();
            pending.pop();
            for (int v : graph[u]) {
                if (color[v] == -1) {
                    color[v] = 1 - color[u];
                    pending.push(v);
                } else if (color[v] == color[u]) {
                    if (u < v) std::cout << "NO\n" << u << ' ' << v << '\n';
                    else std::cout << "NO\n" << v << ' ' << u << '\n';
                    return 0;
                }
            }
        }
    }

    std::cout << "YES\n";
    for (int u = 0; u < n; ++u) {
        if (u > 0) std::cout << ' ';
        std::cout << color[u];
    }
    std::cout << '\n';
    return 0;
}
