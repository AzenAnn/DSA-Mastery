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
        ++out[u];
        ++in[v];
    }
    int answer = -1;
    for (int v = 1; v <= n; ++v) {
        if (in[v] == n - 1 && out[v] == 0) answer = v;
    }
    std::cout << answer << '\n';
}
