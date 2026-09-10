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
        return fa[x] == x ? x : fa[x] = find(fa[x]);
    }
    void unite(int a, int b) {
        a = find(a), b = find(b);
        if (a == b) return;
        if (rk[a] < rk[b]) swap(a, b);
        fa[b] = a;
        if (rk[a] == rk[b]) rk[a]++;
    }
    bool same(int a, int b) {
        return find(a) == find(b);
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
