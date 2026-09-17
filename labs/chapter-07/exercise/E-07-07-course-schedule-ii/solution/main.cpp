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
        int a, b; cin >> a >> b;
        graph[b].push_back(a); ++indegree[a];
    }

    priority_queue<int, vector<int>, greater<int>> ready;
    for (int u = 0; u < n; ++u) if (!indegree[u]) ready.push(u);
    vector<int> order;
    while (!ready.empty()) {
        int u = ready.top(); ready.pop(); order.push_back(u);
        for (int v : graph[u]) if (--indegree[v] == 0) ready.push(v);
    }
    if (static_cast<int>(order.size()) != n) cout << "-1\n";
    else {
        for (int i = 0; i < n; ++i) cout << (i ? " " : "") << order[i];
        cout << '\n';
    }
    return 0;
}
