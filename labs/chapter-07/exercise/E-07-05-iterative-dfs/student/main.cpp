#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    int start = 0;
    if (!(std::cin >> n >> m >> start)) return 0;

    std::vector<std::vector<int>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    for (auto& neighbors : graph) std::sort(neighbors.begin(), neighbors.end());

    // TODO: 用显式栈帧 (顶点, 下一个邻居下标) 模拟递归 DFS，
    // 进入顶点时输出，逐个处理升序邻居；只输出可达顶点，行末无空格。
    std::cout << start << '\n';
    return 0;
}
