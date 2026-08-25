#include <iostream>
#include <vector>
using namespace std;

struct DSU {
    vector<int> fa, rk;
    DSU(int n) {
        fa.resize(n + 1);
        rk.assign(n + 1, 0);
        for (int i = 0; i <= n; ++i) fa[i] = i;
    }
    int find(int x) {
        // TODO: 查找 x 的根节点，并进行路径压缩
        return x;
    }
    void unite(int a, int b) {
        // TODO: 合并 a 和 b 所在的集合
    }
    bool same(int a, int b) {
        // TODO: 判断 a 和 b 是否在同一集合
        return false;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    DSU dsu(n);
    while (q--) {
        int t, a, b;
        cin >> t >> a >> b;
        if (t == 1) {
            dsu.unite(a, b);
        } else {
            cout << (dsu.same(a, b) ? "Yes" : "No") << '\n';
        }
    }
    return 0;
}
