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
    }
    // TODO: 三色标记（0 未访问 / 1 在栈中 / 2 已完成）DFS 判环：
    // 发现指向状态 1 的边即有环，输出 YES 并结束；全部完成则输出 NO。
    std::cout << "NO\n";
    return 0;
}
