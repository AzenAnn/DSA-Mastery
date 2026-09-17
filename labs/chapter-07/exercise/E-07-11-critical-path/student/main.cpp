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
    struct Activity { int from, to; long long duration; };
    vector<Activity> edges(m);
    vector<vector<int>> graph(n);
    vector<int> indegree(n);
    for (int id = 0; id < m; ++id) {
        auto& e = edges[id]; cin >> e.from >> e.to >> e.duration;
        graph[e.from].push_back(id); ++indegree[e.to];
    }

    // TODO: 正向拓扑求 ve，所有事件 vl 初始化为全局工程时间，再逆向求 vl，按输入顺序筛选零余量活动。
    cout << 0 << '\n';
    return 0;
}
