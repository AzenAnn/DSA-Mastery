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
    std::vector<int> label(n, 0);
    int count = 0;
    for (int start = 0; start < n; ++start) {
        if (label[start]) continue;
        ++count;
        std::vector<int> pending{start};
        label[start] = count;
        while (!pending.empty()) {
            int u = pending.back();
            pending.pop_back();
            for (int v : graph[u]) {
                if (!label[v]) {
                    label[v] = count;
                    pending.push_back(v);
                }
            }
        }
    }
    std::cout << count << '\n';
    for (int v = 0; v < n; ++v) std::cout << (v ? " " : "") << label[v];
    std::cout << '\n';
}
