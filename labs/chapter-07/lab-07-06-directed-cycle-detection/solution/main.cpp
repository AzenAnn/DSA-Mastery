#include <iostream>
#include <vector>

bool dfs(int u, const std::vector<std::vector<int>>& graph,
         std::vector<int>& state) {
    state[u] = 1;  // 已发现，仍在当前递归栈中
    for (int v : graph[u]) {
        if (state[v] == 1) return true;   // 指向当前栈中顶点，形成有向环
        if (state[v] == 0 && dfs(v, graph, state)) return true;
    }
    state[u] = 2;  // 已完成
    return false;
}

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
    std::vector<int> state(n, 0);
    bool hasCycle = false;
    for (int v = 0; v < n && !hasCycle; ++v) {
        if (state[v] == 0 && dfs(v, graph, state)) hasCycle = true;
    }

    std::cout << (hasCycle ? "YES" : "NO") << '\n';
    return 0;
}
