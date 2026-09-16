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
        int a, b; cin >> a >> b; // 先修 b，再修 a。
        graph[b].push_back(a); ++indegree[a];
    }

    queue<int> ready;
    for (int u = 0; u < n; ++u) if (!indegree[u]) ready.push(u);
    int removed = 0;
    while (!ready.empty()) {
        int u = ready.front(); ready.pop(); ++removed;
        for (int v : graph[u]) if (--indegree[v] == 0) ready.push(v);
    }
    cout << (removed == n ? "YES" : "NO") << '\n';
    return 0;
}
