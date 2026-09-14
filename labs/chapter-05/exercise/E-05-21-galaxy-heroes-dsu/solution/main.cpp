#include <iostream>
#include <vector>
#include <string>
using namespace std;

struct DSU {
    vector<int> fa, d, sz;
    DSU(int n) {
        fa.resize(n + 1);
        d.assign(n + 1, 0);
        sz.assign(n + 1, 1);
        for (int i = 0; i <= n; ++i) fa[i] = i;
    }
    int find(int x) {
        if (fa[x] == x) return x;
        int root = find(fa[x]);
        d[x] += d[fa[x]];
        return fa[x] = root;
    }
    void merge(int i, int j) {
        int fi = find(i), fj = find(j);
        if (fi == fj) return;
        fa[fi] = fj;
        d[fi] = sz[fj];
        sz[fj] += sz[fi];
    }
    int dist(int i, int j) {
        if (find(i) != find(j)) return -1;
        return abs(d[i] - d[j]) - 1;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        DSU dsu(30000);
        string op;
        while (cin >> op && op != "END") {
            int i, j;
            cin >> i >> j;
            if (op == "M") {
                dsu.merge(i, j);
            } else {
                cout << dsu.dist(i, j) << '\n';
            }
        }
    }
    return 0;
}
