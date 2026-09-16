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
        int a, b; cin >> a >> b; --a; --b;
        graph[a].push_back(b); ++indegree[b];
    }

    constexpr long long MOD = 80112002;
    vector<long long> ways(n);
    queue<int> ready;
    for (int u = 0; u < n; ++u) if (!indegree[u]) {
        ways[u] = 1; ready.push(u);
    }
    long long answer = 0;
    while (!ready.empty()) {
        int u = ready.front(); ready.pop();
        if (graph[u].empty()) answer = (answer + ways[u]) % MOD;
        for (int v : graph[u]) {
            ways[v] = (ways[v] + ways[u]) % MOD;
            if (--indegree[v] == 0) ready.push(v);
        }
    }
    cout << answer << '\n';
    return 0;
}
