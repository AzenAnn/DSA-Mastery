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

    // TODO: 定义 dp[u][j]：u子树中选j个节点（u必选）的最大价值
    // 初始化 dp[u][1] = val[u]，其余为 -inf

    // TODO: 后序遍历（DFS）
    // 对每个子节点v：
    //   1. 递归计算 dp[v][*]
    //   2. 合并到u：倒序枚举j，正序枚举t
    //      dp[u][j+t] = max(dp[u][j+t], dp[u][j] + dp[v][t])

    // TODO: 输出 dp[1][k]，若不可达输出 IMPOSSIBLE

    return 0;
}
