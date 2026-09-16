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

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<vector<pair<int, int>>> graph(n);
    for (int id = 0; id < m; ++id) {
        int u, v; cin >> u >> v;
        graph[u].push_back({v, id}); graph[v].push_back({u, id});
    }
    for (auto& edges : graph) sort(edges.begin(), edges.end());

    vector<int> odd;
    int start = 0;
    while (start < n && graph[start].empty()) ++start;
    for (int u = 0; u < n; ++u) if (graph[u].size() % 2) odd.push_back(u);
    if (!odd.empty() && odd.size() != 2) { cout << "Not Eulerian\n"; return 0; }
    if (odd.size() == 2) start = odd[0];
    if (start == n) start = 0;
    vector<bool> used(m);
    vector<size_t> next(n);
    vector<int> stack{start}, reversed;
    while (!stack.empty()) {
        int u = stack.back();
        while (next[u] < graph[u].size() && used[graph[u][next[u]].second]) ++next[u];
        if (next[u] == graph[u].size()) {
            reversed.push_back(u); stack.pop_back();
        } else {
            auto [v, id] = graph[u][next[u]++];
            used[id] = true; stack.push_back(v);
        }
    }
    // 点数检查同时拒绝含边的多个不连通分量。
    if (reversed.size() != static_cast<size_t>(m + 1)) {
        cout << "Not Eulerian\n"; return 0;
    }
    reverse(reversed.begin(), reversed.end());
    cout << m << '\n';
    for (size_t i = 0; i < reversed.size(); ++i) cout << (i ? " " : "") << reversed[i];
    cout << '\n';
    return 0;
}
