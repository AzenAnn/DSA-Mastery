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
        // TODO: 查找根节点，同时更新到根的距离
        return x;
    }
    void merge(int i, int j) {
        // TODO: 将 i 所在队列接到 j 所在队列尾部
    }
    int dist(int i, int j) {
        // TODO: 返回 i 和 j 之间间隔的战舰数，不在同一列返回 -1
        return -1;
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
