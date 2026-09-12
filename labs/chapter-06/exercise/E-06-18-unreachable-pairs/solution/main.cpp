#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    std::vector<bool> visited(n, false);
    long long seen = 0, answer = 0;
    for (int start = 0; start < n; ++start) {
        if (visited[start]) continue;
        long long size = 0;
        std::vector<int> pending{start};
        visited[start] = true;
        while (!pending.empty()) {
            int u = pending.back();
            pending.pop_back();
            ++size;
            for (int v : graph[u]) {
                if (!visited[v]) {
                    visited[v] = true;
                    pending.push_back(v);
                }
            }
        }
        answer += seen * size;
        seen += size;
    }
    std::cout << answer << '\n';
}
