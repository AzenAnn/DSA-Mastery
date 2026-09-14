#include <algorithm>
#include <array>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <limits>
#include <numeric>
#include <queue>
#include <string>
#include <tuple>
#include <unordered_map>
#include <utility>
#include <vector>

using namespace std;

struct Edge { int to, reverse; long long capacity, cost; };
void addEdge(vector<vector<Edge>>& graph, int u, int v, long long cap, long long cost) {
    // 题面不允许自环；反向边的编号与原始反向输入边彼此独立。
    int a = static_cast<int>(graph[u].size()), b = static_cast<int>(graph[v].size());
    graph[u].push_back({v, b, cap, cost});
    graph[v].push_back({u, a, 0, -cost});
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, source, sink;
    if (!(cin >> n >> m >> source >> sink)) return 0;
    --source; --sink;
    vector<vector<Edge>> graph(n);
    for (int i = 0; i < m; ++i) {
        int u, v; long long cap, cost; cin >> u >> v >> cap >> cost;
        addEdge(graph, u - 1, v - 1, cap, cost);
    }

    const long long INF = numeric_limits<long long>::max() / 4;
    long long flow = 0, cost = 0;
    while (true) {
        vector<long long> distance(n, INF);
        vector<int> parent(n, -1), edgeIndex(n, -1);
        distance[source] = 0;
        // 初始网络无负费用环；最短路增广维持残量网络无负环。
        for (int round = 0; round < n - 1; ++round) {
            bool changed = false;
            for (int u = 0; u < n; ++u) if (distance[u] != INF) {
                for (int i = 0; i < static_cast<int>(graph[u].size()); ++i) {
                    const auto& e = graph[u][i];
                    if (e.capacity > 0 && distance[e.to] > distance[u] + e.cost) {
                        distance[e.to] = distance[u] + e.cost;
                        parent[e.to] = u; edgeIndex[e.to] = i; changed = true;
                    }
                }
            }
            if (!changed) break;
        }
        if (distance[sink] == INF) break;
        long long pushed = INF;
        for (int v = sink; v != source; v = parent[v])
            pushed = min(pushed, graph[parent[v]][edgeIndex[v]].capacity);
        for (int v = sink; v != source; v = parent[v]) {
            auto& e = graph[parent[v]][edgeIndex[v]];
            e.capacity -= pushed; graph[v][e.reverse].capacity += pushed;
        }
        flow += pushed; cost += pushed * distance[sink];
    }
    cout << flow << ' ' << cost << '\n';
    return 0;
}
