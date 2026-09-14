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

    int n, m, target, k;
    if (!(cin >> n >> m >> target >> k)) return 0;
    vector<tuple<int, int, long long>> edges;
    vector<vector<pair<int, long long>>> reversed(n);
    for (int i = 0; i < m; ++i) {
        int u, v; long long w; cin >> u >> v >> w;
        edges.push_back({u, v, w}); reversed[v].push_back({u, w});
    }
    vector<vector<long long>> heuristics(k, vector<long long>(n));
    for (auto& h : heuristics) for (auto& value : h) cin >> value;

    const long long INF = numeric_limits<long long>::max() / 4;
    vector<long long> distance(n, INF);
    using Entry = pair<long long, int>;
    priority_queue<Entry, vector<Entry>, greater<Entry>> ready;
    distance[target] = 0; ready.push({0, target});
    while (!ready.empty()) {
        auto [d, u] = ready.top(); ready.pop();
        if (d != distance[u]) continue;
        for (auto [v, w] : reversed[u]) if (distance[v] > d + w) {
            distance[v] = d + w; ready.push({distance[v], v});
        }
    }
    for (const auto& h : heuristics) {
        bool admissible = h[target] == 0, consistent = h[target] == 0;
        for (int u = 0; u < n; ++u) {
            if (distance[u] != INF && h[u] > distance[u]) admissible = false;
        }
        for (auto [u, v, w] : edges) if (h[u] > w + h[v]) consistent = false;
        cout << (admissible ? "YES" : "NO") << ' ' << (consistent ? "YES" : "NO") << '\n';
    }
    return 0;
}
