#include <iostream>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0;
    if (!(std::cin >> n)) return 0;
    int a = 0, b = 0, center = -1;
    std::cin >> a >> b;
    for (int i = 1; i < n - 1; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        if (i == 1) center = (a == u || a == v) ? a : b;
    }
    std::cout << center << '\n';
}
