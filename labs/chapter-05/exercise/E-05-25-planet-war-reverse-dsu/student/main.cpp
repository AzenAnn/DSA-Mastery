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
        // TODO: 查找根节点并路径压缩
        return x;
    }
    bool unite(int a, int b) {
        // TODO: 合并集合并返回是否有效合并
        return false;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> edges(m);
    for (auto& [x, y] : edges) cin >> x >> y;
    // TODO: 建立邻接表 adj（复活星球时只遍历与它相连的航线）
    int k;
    cin >> k;
    vector<int> order(k);
    vector<char> dead(n + 1, 0);
    for (int i = 0; i < k; ++i) {
        cin >> order[i];
        dead[order[i]] = 1;
    }
    DSU dsu(n);
    int comp = n - k;
    // TODO: 预先合并两端都活着的航线，初始化 comp
    vector<int> ans(k);
    for (int i = k - 1; i >= 0; --i) {
        // TODO: 记录 ans[i] = comp；
        //       复活 order[i]（comp++）；
        //       枚举与其相连的航线，两端都活着则合并并更新 comp
    }
    for (int x : ans) cout << x << '\n';
    return 0;
}
