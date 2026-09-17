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
    for (int i = 0; i < m; ++i) {
        int u, v; cin >> u >> v;
        graph[u].push_back(v); graph[v].push_back(u);
    }

    int start = 0;
    while (start < n && graph[start].empty()) ++start;
    if (start == n) {
        cout << "Eulerian Circuit\n";
        return 0;
    }
    vector<bool> seen(n);
    queue<int> pending;
    pending.push(start); seen[start] = true;
    while (!pending.empty()) {
        int u = pending.front(); pending.pop();
        for (int v : graph[u]) if (!seen[v]) {
            seen[v] = true; pending.push(v);
        }
    }
    vector<int> odd;
    for (int u = 0; u < n; ++u) {
        if (!graph[u].empty() && !seen[u]) {
            cout << "Not Eulerian\n"; return 0;
        }
        if (graph[u].size() % 2) odd.push_back(u);
    }
    if (odd.empty()) cout << "Eulerian Circuit\n";
    else if (odd.size() == 2) cout << "Eulerian Path " << odd[0] << '\n';
    else cout << "Not Eulerian\n";
    return 0;
}
