#include <iostream>
#include <vector>
using namespace std;

struct DSU {
    vector<int> fa;
    DSU(int n) {
        fa.resize(n + 1);
        for (int i = 0; i <= n; ++i) fa[i] = i;
    }
    int find(int x) {
        int r = x;                       // 先找到根
        while (fa[r] != r) r = fa[r];
        while (fa[x] != r) {             // 再沿途压缩
            int nxt = fa[x];
            fa[x] = r;
            x = nxt;
        }
        return r;
    }
    // 合并两个集合，返回是否发生了有效合并
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        fa[ra] = rb;
        return true;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);      // 邻接表：复活时只遍历与自己相连的航线
    for (int i = 0; i < m; ++i) {
        int x, y;
        cin >> x >> y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    int k;
    cin >> k;
    vector<int> order(k);
    vector<char> dead(n + 1, 0);
    for (int i = 0; i < k; ++i) {
        cin >> order[i];
        dead[order[i]] = 1;          // 初始状态：前 k 颗全部被摧毁
    }
    DSU dsu(n);
    int comp = n - k;                // 还活着的星球各自成块
    for (int v = 1; v <= n; ++v)     // 预先合并两端都活着的航线
        if (!dead[v])
            for (int u : adj[v])
                if (!dead[u] && u > v) comp -= dsu.unite(u, v);
    vector<int> ans(k);
    for (int i = k - 1; i >= 0; --i) {   // 逆序复活
        ans[i] = comp;                   // 当前 comp = 前 i+1 颗被毁后的块数
        int v = order[i];
        dead[v] = 0;
        ++comp;                          // v 自身先成一个块
        for (int u : adj[v])             // 重新接入 v 的航线
            if (!dead[u]) comp -= dsu.unite(v, u);
    }
    for (int x : ans) cout << x << '\n';
    return 0;
}
