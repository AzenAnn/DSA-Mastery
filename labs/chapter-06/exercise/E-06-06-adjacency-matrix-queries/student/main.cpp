#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0, q = 0;
    if (!(std::cin >> n >> m >> q)) return 0;
    std::vector<std::vector<int>> a(n, std::vector<int>(n));
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        // TODO: Store this undirected edge; input labels start at 1.
    }
    for (const auto& row : a) {
        for (int v = 0; v < n; ++v) std::cout << (v ? " " : "") << row[v];
        std::cout << '\n';
    }
    for (int i = 0; i < q; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        int answer = 0;
        // TODO: Answer the adjacency query from the matrix.
        std::cout << answer << '\n';
    }
}
