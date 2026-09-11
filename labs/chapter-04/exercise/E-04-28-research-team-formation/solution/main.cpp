#include <bits/stdc++.h>
using namespace std;

const int INF = -1e9;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;

    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; ++i) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
    }

    vector<int> val(n + 1);
    for (int i = 1; i <= n; ++i) cin >> val[i];

    vector<vector<int>> dp(n + 1, vector<int>(k + 1, INF));

    function<void(int)> dfs = [&](int u) {
        dp[u][1] = val[u];
        for (int v : adj[u]) {
            dfs(v);
            for (int j = k; j >= 1; --j) {
                if (dp[u][j] == INF) continue;
                for (int t = 1; t <= k - j; ++t) {
                    if (dp[v][t] == INF) continue;
                    dp[u][j + t] = max(dp[u][j + t], dp[u][j] + dp[v][t]);
                }
            }
        }
    };

    dfs(1);

    if (dp[1][k] == INF) {
        cout << "IMPOSSIBLE\n";
    } else {
        cout << dp[1][k] << '\n';
    }

    return 0;
}
