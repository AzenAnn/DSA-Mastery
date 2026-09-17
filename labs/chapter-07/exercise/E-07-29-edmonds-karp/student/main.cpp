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
        int u, v; long long cap; cin >> u >> v >> cap;
        addEdge(graph, u - 1, v - 1, cap, 0);
    }

    // TODO: 对残量图 BFS 找最少边增广路；按瓶颈更新正反边容量，累计 long long 流量。
    cout << 0 << '\n';
    return 0;
}
