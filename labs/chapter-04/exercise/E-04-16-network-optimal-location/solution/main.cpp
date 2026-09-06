#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    vector<vector<pair<int, int>>> adj(n + 1);
    for (int i = 0; i < n - 1; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }

    vector<ll> dp(n + 1, 0);
    vector<int> sz(n + 1, 0);

    // 第一次 DFS：计算子树大小和 dp[1]
    function<void(int, int)> dfs1 = [&](int u, int p) {
        sz[u] = 1;
        for (auto [v, w] : adj[u]) {
            if (v == p) continue;
            dfs1(v, u);
            sz[u] += sz[v];
            dp[1] += (ll)w * sz[v];
        }
    };

    if (n > 1) dfs1(1, 0);

    // 第二次 DFS：换根 DP
    function<void(int, int)> dfs2 = [&](int u, int p) {
        for (auto [v, w] : adj[u]) {
            if (v == p) continue;
            dp[v] = dp[u] + (ll)(n - 2 * sz[v]) * w;
            dfs2(v, u);
        }
    };

    if (n > 1) dfs2(1, 0);

    for (int i = 1; i <= n; ++i) {
        cout << dp[i] << '\n';
    }

    return 0;
}
