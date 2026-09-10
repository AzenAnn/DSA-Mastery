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

    // TODO: 对 0..n-1 中未访问的顶点依次启动递归 DFS，
    // 进入时记录 d[u] = ++timer，返回前记录 f[u] = ++timer。
    std::vector<int> d(n, 0);
    std::vector<int> f(n, 0);

    for (int vertex = 0; vertex < n; ++vertex) {
        if (vertex > 0) std::cout << ' ';
        std::cout << d[vertex];
    }
    std::cout << '\n';

    for (int vertex = 0; vertex < n; ++vertex) {
        if (vertex > 0) std::cout << ' ';
        std::cout << f[vertex];
    }
    std::cout << '\n';
    return 0;
}
