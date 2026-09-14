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
    for (int id = 1; id <= m; ++id) {
        int u, v; cin >> u >> v;
        graph[u].push_back({v, id});
    }
    for (auto& edges : graph) sort(edges.begin(), edges.end());

    // TODO: 维护颜色、发现时间和显式栈帧；按边编号输出 TREE/BACK/FORWARD/CROSS。
    cout << 0 << '\n';
    return 0;
}
