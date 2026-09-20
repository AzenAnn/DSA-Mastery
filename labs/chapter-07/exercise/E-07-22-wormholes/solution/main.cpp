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

    int tests;
    if (!(cin >> tests)) return 0;

    while (tests--) {
        int n, roads, holes; cin >> n >> roads >> holes;
        vector<tuple<int, int, long long>> edges;
        for (int i = 0; i < roads; ++i) {
            int u, v; long long t; cin >> u >> v >> t; --u; --v;
            edges.push_back({u, v, t}); edges.push_back({v, u, t});
        }
        for (int i = 0; i < holes; ++i) {
            int u, v; long long t; cin >> u >> v >> t;
            edges.push_back({u - 1, v - 1, -t});
        }
        // 等价于超级源以零权边连接全图，能检测不与 1 连通的负环。
        vector<long long> distance(n, 0);
        bool changed = false;
        for (int round = 0; round < n; ++round) {
            changed = false;
            for (auto [u, v, w] : edges) if (distance[v] > distance[u] + w) {
                distance[v] = distance[u] + w; changed = true;
            }
            if (!changed) break;
        }
        cout << (changed ? "YES" : "NO") << '\n';
    }
    return 0;
}
