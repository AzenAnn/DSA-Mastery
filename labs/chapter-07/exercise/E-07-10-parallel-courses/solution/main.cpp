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

    vector<long long> finish = duration;
    queue<int> ready;
    for (int u = 0; u < n; ++u) if (!indegree[u]) ready.push(u);
    while (!ready.empty()) {
        int u = ready.front(); ready.pop();
        for (int v : graph[u]) {
            finish[v] = max(finish[v], finish[u] + duration[v]);
            if (--indegree[v] == 0) ready.push(v);
        }
    }
    cout << *max_element(finish.begin(), finish.end()) << '\n';
    return 0;
}
