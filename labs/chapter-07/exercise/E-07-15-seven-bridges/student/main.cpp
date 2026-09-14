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

    // TODO: 按题面固定起点和邻接顺序执行 Hierholzer；用边编号标记两条邻接记录。
    cout << 0 << '\n';
    return 0;
}
