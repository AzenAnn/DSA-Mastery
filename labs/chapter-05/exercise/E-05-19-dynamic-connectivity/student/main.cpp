#include <iostream>
#include <vector>
using namespace std;

struct DSU {
    vector<int> fa, rk;
    int count;
    DSU(int n) {
        fa.resize(n + 1);
        rk.assign(n + 1, 0);
        for (int i = 0; i <= n; ++i) fa[i] = i;
        count = n;
    }
    int find(int x) {
        // TODO: 查找根节点并路径压缩
        return x;
    }
    void unite(int a, int b) {
        // TODO: 合并集合，若成功合并则 count--
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    DSU dsu(n);
    while (q--) {
        int t;
        cin >> t;
        if (t == 1) {
            int u, v;
            cin >> u >> v;
            dsu.unite(u, v);
        } else {
            cout << dsu.count << '\n';
        }
    }
    return 0;
}
