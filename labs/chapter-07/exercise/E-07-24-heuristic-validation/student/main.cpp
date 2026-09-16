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

    // TODO: 反向 Dijkstra 求到终点的真实距离；分别检查不高估与每条有向边的三角不等式，并要求 h(t)=0。
    cout << 0 << '\n';
    return 0;
}
