#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) return 0;

    std::vector<std::vector<int>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    for (auto& neighbors : graph) std::sort(neighbors.begin(), neighbors.end());

    // TODO: 按 0..n-1 扫描，对未标记顶点启动 DFS 并标记所在分量；
    // 每启动一次 DFS，分量编号加一，最后统计个数 k。
    std::vector<int> comp(n, 0);
    int k = 1;

    std::cout << k << '\n';
    for (int vertex = 0; vertex < n; ++vertex) {
        if (vertex > 0) std::cout << ' ';
        std::cout << comp[vertex];
    }
    std::cout << '\n';
    return 0;
}
