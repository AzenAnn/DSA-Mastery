#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<int> in(n + 1), out(n + 1);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        // TODO: Update the correct incoming and outgoing counts.
    }
    int answer = -1;
    // TODO: Find the vertex satisfying both judge conditions.
    std::cout << answer << '\n';
}
