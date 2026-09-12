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
        a[u - 1][v - 1] = a[v - 1][u - 1] = 1;
    }
    for (const auto& row : a) {
        for (int v = 0; v < n; ++v) std::cout << (v ? " " : "") << row[v];
        std::cout << '\n';
    }
    for (int i = 0; i < q; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        std::cout << a[u - 1][v - 1] << '\n';
    }
}
