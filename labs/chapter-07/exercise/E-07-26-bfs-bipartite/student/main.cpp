#include <algorithm>
#include <iostream>
#include <queue>
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

    // TODO: 按 0..n-1 扫描未染色顶点，起点染 0 后 BFS；
    // 邻居同色即冲突，输出 NO + 冲突边（u < v）并结束；
    // 全部完成输出 YES + 0/1 颜色数组。
    std::vector<int> color(n, 0);

    std::cout << "YES\n";
    for (int vertex = 0; vertex < n; ++vertex) {
        if (vertex > 0) std::cout << ' ';
        std::cout << color[vertex];
    }
    std::cout << '\n';
    return 0;
}
