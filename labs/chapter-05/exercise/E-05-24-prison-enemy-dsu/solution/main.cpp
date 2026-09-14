#include <algorithm>
#include <iostream>
#include <tuple>
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
    void unite(int a, int b) {
        fa[find(a)] = find(b);
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, int>> e(m);   // (a, b, w)
    for (auto& [a, b, w] : e) cin >> a >> b >> w;
    // 怨念从大到小排序
    sort(e.begin(), e.end(),
         [](const tuple<int, int, int>& x, const tuple<int, int, int>& y) {
             return get<2>(x) > get<2>(y);
         });
    DSU dsu(2 * n);                      // 扩展域：i + n 表示 i 的"敌人域"
    for (auto& [a, b, w] : e) {
        if (dsu.find(a) == dsu.find(b)) {   // 已被迫同狱 -> 怨念引爆
            cout << w << '\n';
            return 0;
        }
        dsu.unite(a, b + n);   // a 与 b 的敌人同狱
        dsu.unite(b, a + n);   // b 与 a 的敌人同狱
    }
    cout << 0 << '\n';
    return 0;
}
