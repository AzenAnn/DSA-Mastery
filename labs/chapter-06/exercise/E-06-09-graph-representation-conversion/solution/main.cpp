#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    char type = 'U', format = 'E';
    int n = 0;
    if (!(std::cin >> type >> format >> n)) return 0;
    std::vector<std::vector<int>> a(n, std::vector<int>(n));
    if (format == 'E') {
        int m = 0;
        std::cin >> m;
        for (int i = 0; i < m; ++i) {
            int u = 0, v = 0;
            std::cin >> u >> v;
            a[u][v] = 1;
            if (type == 'U') a[v][u] = 1;
        }
    } else if (format == 'M') {
        for (auto& row : a) for (int& value : row) std::cin >> value;
    } else {
        for (int u = 0; u < n; ++u) {
            int k = 0;
            std::cin >> k;
            for (int i = 0; i < k; ++i) {
                int v = 0;
                std::cin >> v;
                a[u][v] = 1;
            }
        }
    }
    std::vector<std::vector<int>> graph(n);
    std::vector<std::pair<int, int>> edges;
    std::cout << "MATRIX\n";
    for (int u = 0; u < n; ++u) {
        for (int v = 0; v < n; ++v) {
            std::cout << (v ? " " : "") << a[u][v];
            if (a[u][v]) {
                graph[u].push_back(v);
                if (type == 'D' || u < v) edges.emplace_back(u, v);
            }
        }
        std::cout << '\n';
    }
    std::cout << "LIST\n";
    for (const auto& neighbors : graph) {
        std::cout << neighbors.size();
        for (int v : neighbors) std::cout << ' ' << v;
        std::cout << '\n';
    }
    std::cout << "EDGES " << edges.size() << '\n';
    for (const auto& edge : edges) std::cout << edge.first << ' ' << edge.second << '\n';
}
