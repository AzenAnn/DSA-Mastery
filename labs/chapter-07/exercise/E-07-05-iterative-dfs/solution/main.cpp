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

    struct Frame {
        int vertex;
        std::size_t next;
    };
    std::vector<char> visited(n, 0);
    std::vector<Frame> stack;
    stack.reserve(n);
    stack.push_back({start, 0});
    visited[start] = 1;

    bool first = true;
    while (!stack.empty()) {
        Frame& frame = stack.back();
        const int u = frame.vertex;
        if (frame.next == 0) {
            if (!first) std::cout << ' ';
            first = false;
            std::cout << u;
        }
        while (frame.next < graph[u].size() && visited[graph[u][frame.next]]) ++frame.next;
        if (frame.next == graph[u].size()) {
            stack.pop_back();
            continue;
        }
        const int v = graph[u][frame.next++];
        visited[v] = 1;
        stack.push_back({v, 0});
    }
    std::cout << '\n';
    return 0;
}
