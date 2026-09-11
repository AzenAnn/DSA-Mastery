#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

struct Frame { int vertex; std::size_t next; };

std::vector<int> components(const std::vector<std::vector<int>>& graph,
                            const std::vector<std::vector<int>>& reversed) {
    int n = static_cast<int>(graph.size());
    std::vector<bool> visited(n, false);
    std::vector<int> order;
    for (int start = 0; start < n; ++start) {
        if (visited[start]) continue;
        std::vector<Frame> stack{{start, 0}};
        visited[start] = true;
        // Keep a neighbor cursor so vertices enter order only when DFS exits.
        while (!stack.empty()) {
            Frame& top = stack.back();
            int u = top.vertex;
            if (top.next == graph[u].size()) {
                order.push_back(u);
                stack.pop_back();
            } else {
                int v = graph[u][top.next++];
                if (!visited[v]) {
                    visited[v] = true;
                    stack.push_back({v, 0});
                }
            }
        }
    }
    std::vector<int> raw(n, 0);
    int count = 0;
    for (auto it = order.rbegin(); it != order.rend(); ++it) {
        if (raw[*it]) continue;
        ++count;
        std::vector<int> stack{*it};
        raw[*it] = count;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (int v : reversed[u]) {
                if (!raw[v]) {
                    raw[v] = count;
                    stack.push_back(v);
                }
            }
        }
    }
    std::vector<int> canonical(count + 1, 0), label(n);
    int next = 0;
    for (int v = 0; v < n; ++v) {
        if (!canonical[raw[v]]) canonical[raw[v]] = ++next;
        label[v] = canonical[raw[v]];
    }
    return label;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, m = 0;
    if (!(std::cin >> n >> m)) return 0;
    std::vector<std::vector<int>> graph(n), reversed(n);
    std::vector<std::pair<int, int>> edges;
    for (int i = 0; i < m; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        graph[u].push_back(v);
        reversed[v].push_back(u);
        edges.emplace_back(u, v);
    }
    auto label = components(graph, reversed);
    int count = 0;
    for (int value : label) if (value > count) count = value;
    std::vector<std::pair<int, int>> condensed;
    for (const auto& edge : edges) {
        int from = label[edge.first], to = label[edge.second];
        if (from != to) condensed.emplace_back(from, to);
    }
    std::sort(condensed.begin(), condensed.end());
    condensed.erase(std::unique(condensed.begin(), condensed.end()), condensed.end());
    std::cout << count << ' ' << condensed.size() << '\n';
    for (int v = 0; v < n; ++v) std::cout << (v ? " " : "") << label[v];
    std::cout << '\n';
    for (const auto& edge : condensed) std::cout << edge.first << ' ' << edge.second << '\n';
}
