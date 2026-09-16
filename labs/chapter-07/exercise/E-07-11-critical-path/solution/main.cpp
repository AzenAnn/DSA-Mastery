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

    queue<int> ready;
    for (int u = 0; u < n; ++u) if (!indegree[u]) ready.push(u);
    vector<int> order;
    vector<long long> earliest(n);
    while (!ready.empty()) {
        int u = ready.front(); ready.pop(); order.push_back(u);
        for (int id : graph[u]) {
            const auto& e = edges[id];
            earliest[e.to] = max(earliest[e.to], earliest[u] + e.duration);
            if (--indegree[e.to] == 0) ready.push(e.to);
        }
    }
    long long total = *max_element(earliest.begin(), earliest.end());
    vector<long long> latest(n, total);
    for (auto it = order.rbegin(); it != order.rend(); ++it) {
        for (int id : graph[*it]) {
            const auto& e = edges[id];
            latest[e.from] = min(latest[e.from], latest[e.to] - e.duration);
        }
    }
    vector<int> critical;
    for (int id = 0; id < m; ++id) {
        const auto& e = edges[id];
        if (earliest[e.from] == latest[e.to] - e.duration) critical.push_back(id + 1);
    }
    cout << total << '\n' << critical.size() << '\n';
    for (size_t i = 0; i < critical.size(); ++i) cout << (i ? " " : "") << critical[i];
    cout << '\n';
    return 0;
}
