#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> reversed(n);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        // TODO: Reverse this edge, preserving its multiplicity.
    }
    for (auto& neighbors : reversed) {
        // TODO: Sort the neighbors without removing repeated edges.
        std::cout << neighbors.size();
        for (int v : neighbors) std::cout << ' ' << v;
        std::cout << '\n';
    }
}
