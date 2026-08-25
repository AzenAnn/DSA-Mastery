#include <algorithm>
#include <iostream>
#include <queue>
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

    std::vector<int> order;
    std::vector<int> distance(n, -1);
    std::queue<int> pending;
    pending.push(start);
    distance[start] = 0;

    while (!pending.empty()) {
        const int u = pending.front();
        pending.pop();
        order.push_back(u);
        for (int v : graph[u]) {
            if (distance[v] != -1) continue;
            distance[v] = distance[u] + 1;
            pending.push(v);
        }
    }

    for (std::size_t i = 0; i < order.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << order[i];
    }
    std::cout << '\n';

    for (int vertex = 0; vertex < n; ++vertex) {
        if (vertex > 0) std::cout << ' ';
        std::cout << distance[vertex];
    }
    std::cout << '\n';
    return 0;
}
