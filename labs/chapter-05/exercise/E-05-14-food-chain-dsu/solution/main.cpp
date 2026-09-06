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
        return fa[x] == x ? x : fa[x] = find(fa[x]);
    }
    void unite(int a, int b) {
        a = find(a), b = find(b);
        if (a != b) fa[a] = b;
    }
    bool same(int a, int b) {
        return find(a) == find(b);
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    DSU dsu(3 * n);
    int ans = 0;
    while (k--) {
        int d, x, y;
        cin >> d >> x >> y;
        if (x > n || y > n) { ans++; continue; }
        if (d == 1) {
            if (dsu.same(x, y + n) || dsu.same(x, y + 2 * n)) ans++;
            else {
                dsu.unite(x, y);
                dsu.unite(x + n, y + n);
                dsu.unite(x + 2 * n, y + 2 * n);
            }
        } else {
            if (x == y || dsu.same(x, y) || dsu.same(x, y + 2 * n)) ans++;
            else {
                dsu.unite(x, y + n);
                dsu.unite(x + n, y + 2 * n);
                dsu.unite(x + 2 * n, y);
            }
        }
    }
    cout << ans << '\n';
    return 0;
}
