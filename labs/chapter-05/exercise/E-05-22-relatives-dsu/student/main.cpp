#include <iostream>
#include <vector>
using namespace std;

struct DSU {
    vector<int> fa;
    DSU(int n) {
        fa.resize(n + 1);
        for (int i = 1; i <= n; ++i) fa[i] = i;
    }
    int find(int x) {
        // TODO: 查找根节点并进行路径压缩
        return x;
    }
    void unite(int a, int b) {
        // TODO: 合并两个集合（建议先找根再连接）
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
        dsu.unite(u, v);
    }
    while (q--) {
        int a, b;
        cin >> a >> b;
        cout << (dsu.find(a) == dsu.find(b) ? "Yes" : "No") << '\n';
    }
    return 0;
}
