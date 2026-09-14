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
    vector<vector<int>> graph(n);
    vector<int> indegree(n);
    for (int i = 0; i < m; ++i) {
        int u, v; cin >> u >> v; --u; --v;
        graph[u].push_back(v); ++indegree[v];
    }
    vector<long long> duration(n);
    for (auto& value : duration) cin >> value;

    // TODO: 拓扑序计算每门课的最早完成时刻，多个先修取最大值，答案取全图最大完成时刻。
    cout << 0 << '\n';
    return 0;
}
