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
    vector<vector<int>> reversed(n);
    vector<int> outdegree(n);
    for (int i = 0; i < m; ++i) {
        int u, v; cin >> u >> v;
        reversed[v].push_back(u); ++outdegree[u];
    }

    queue<int> ready;
    for (int u = 0; u < n; ++u) if (!outdegree[u]) ready.push(u);
    vector<bool> safe(n);
    while (!ready.empty()) {
        int v = ready.front(); ready.pop(); safe[v] = true;
        for (int u : reversed[v]) if (--outdegree[u] == 0) ready.push(u);
    }
    cout << count(safe.begin(), safe.end(), true) << '\n';
    bool first = true;
    for (int u = 0; u < n; ++u) if (safe[u]) {
        cout << (first ? "" : " ") << u; first = false;
    }
    cout << '\n';
    return 0;
}
