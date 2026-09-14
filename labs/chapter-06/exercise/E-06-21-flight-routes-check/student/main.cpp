#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n + 1), reversed(n + 1);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        reversed[v].push_back(u);
    }
    bool strong = false;
    int from = -1, to = -1;
    // TODO: Traverse both graphs from 1 and apply the witness priority rules.
    if (strong) std::cout << "YES\n";
    else std::cout << "NO\n" << from << ' ' << to << '\n';
}
