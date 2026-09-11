#include <iostream>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0;
    if (!(std::cin >> n)) return 0;
    int center = -1;
    for (int i = 0; i < n - 1; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        // TODO: Identify the shared endpoint while consuming all edges.
    }
    std::cout << center << '\n';
}
