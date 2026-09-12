#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<int> degree(n);
    std::vector<std::vector<int>> adjacent(n, std::vector<int>(n));
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        // TODO: Record adjacency and degree information.
    }
    int answer = 0;
    // TODO: Enumerate distinct city pairs and avoid counting their shared road twice.
    std::cout << answer << '\n';
}
