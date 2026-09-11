#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<std::vector<int>> connected(n, std::vector<int>(n));
    for (auto& row : connected) for (int& value : row) std::cin >> value;
    std::vector<bool> visited(n, false);
    int count = 0;
    for (int start = 0; start < n; ++start) {
        if (visited[start]) continue;
        ++count;
        std::vector<int> pending{start};
        visited[start] = true;
        while (!pending.empty()) {
            int u = pending.back();
            pending.pop_back();
            for (int v = 0; v < n; ++v) {
                if (connected[u][v] && !visited[v]) {
                    visited[v] = true;
                    pending.push_back(v);
                }
            }
        }
    }
    std::cout << count << '\n';
}
