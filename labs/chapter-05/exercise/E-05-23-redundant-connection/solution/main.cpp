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
        int r = x;                       // 先找到根
        while (fa[r] != r) r = fa[r];
        while (fa[x] != r) {             // 再沿途压缩
            int nxt = fa[x];
            fa[x] = r;
            x = nxt;
        }
        return r;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    DSU dsu(n);
    for (int i = 0; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        if (dsu.find(u) == dsu.find(v)) {   // 两端已连通 -> 成环
            cout << u << " " << v << '\n';
            return 0;
        }
        dsu.fa[dsu.find(u)] = dsu.find(v);  // 否则正常合并
    }
    return 0;
}
