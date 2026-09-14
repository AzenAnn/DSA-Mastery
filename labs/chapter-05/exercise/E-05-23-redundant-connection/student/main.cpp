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
        // TODO: 查找根节点并路径压缩
        return x;
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
        // TODO: 若 u、v 已连通则输出 u v 并结束程序；
        //       否则把两个集合合并
    }
    return 0;
}
