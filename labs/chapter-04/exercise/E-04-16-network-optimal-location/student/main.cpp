#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    // TODO: 构建树的邻接表
    // 注意：树是无向图，每条边要加两次

    // TODO: 第一次 DFS（后序遍历）：
    // 1. 计算每个节点的子树大小 sz[u]
    // 2. 累加计算以节点 1 为根时的总距离和 dp[1]
    // 提示：dp[1] += w * sz[v]

    // TODO: 第二次 DFS（先序遍历）：
    // 利用换根公式 dp[v] = dp[u] + (n - 2 * sz[v]) * w
    // 计算所有节点作为根时的总距离和

    // TODO: 输出 dp[1] 到 dp[n]
    // 注意使用 long long

    return 0;
}
