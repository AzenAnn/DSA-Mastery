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
        // TODO: 查找根节点并路径压缩
        return x;
    }
    void unite(int a, int b) {
        // TODO: 合并两个集合（连接两个根）
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, int>> e(m);
    for (auto& [a, b, w] : e) cin >> a >> b >> w;
    // TODO: 按 w 从大到小排序
    DSU dsu(2 * n);   // 扩展域：i + n 表示 i 的敌人域
    for (auto& [a, b, w] : e) {
        // TODO: 若 a、b 已同集合，输出 w 并结束；
        //       否则 unite(a, b + n) 与 unite(b, a + n)
    }
    cout << 0 << '\n';
    return 0;
}
