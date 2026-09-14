#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

void dfs(int u, const std::vector<std::vector<int>>& graph,
         std::vector<bool>& visited, std::vector<int>& d, std::vector<int>& f,
         int& timer, int depth = 0) {
    visited[u] = true;
    d[u] = ++timer;
    // Windows 原生工具链的默认栈较小。递归较深时用等价栈帧完成子树，
    // 保留进入/退出事件顺序，时间戳与无限栈递归完全一致。
    if (depth == 256) {
        std::vector<std::pair<int, std::size_t>> frames{{u, 0}};
        while (!frames.empty()) {
            int vertex = frames.back().first;
            auto& next = frames.back().second;
            if (next == graph[vertex].size()) {
                f[vertex] = ++timer;
                frames.pop_back();
            } else {
                int neighbor = graph[vertex][next++];
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    d[neighbor] = ++timer;
                    frames.push_back({neighbor, 0});
                }
            }
        }
        return;
    }
    for (int v : graph[u]) {
        if (!visited[v]) dfs(v, graph, visited, d, f, timer, depth + 1);
    }
    f[u] = ++timer;
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
        graph[v].push_back(u);
    }
    for (auto& neighbors : graph) std::sort(neighbors.begin(), neighbors.end());

    std::vector<bool> visited(n, false);
    std::vector<int> d(n, 0);
    std::vector<int> f(n, 0);
    int timer = 0;
    for (int v = 0; v < n; ++v) {
        if (!visited[v]) dfs(v, graph, visited, d, f, timer);
    }

    for (int u = 0; u < n; ++u) {
        if (u > 0) std::cout << ' ';
        std::cout << d[u];
    }
    std::cout << '\n';

    for (int u = 0; u < n; ++u) {
        if (u > 0) std::cout << ' ';
        std::cout << f[u];
    }
    std::cout << '\n';
    return 0;
}
