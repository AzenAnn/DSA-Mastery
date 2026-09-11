#include <iostream>
#include <vector>
using namespace std;

struct DSU {
    vector<int> fa;
    DSU(int n) {
        fa.resize(n + 1);
        for (int i = 1; i <= n; ++i) fa[i] = i;   // 初始各自为族
    }
    int find(int x) {
        int r = x;                                   // 先找到根
        while (fa[r] != r) r = fa[r];
        while (fa[x] != r) {                         // 再沿途压缩
            int nxt = fa[x];
            fa[x] = r;
            x = nxt;
        }
        return r;
    }
    void unite(int a, int b) {
        fa[find(a)] = find(b);
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, q;
    cin >> n >> m >> q;
    DSU dsu(n);
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        dsu.unite(u, v);            // 每对关系合并一次
    }
    while (q--) {
        int a, b;
        cin >> a >> b;
        cout << (dsu.find(a) == dsu.find(b) ? "Yes" : "No") << '\n';
    }
    return 0;
}
