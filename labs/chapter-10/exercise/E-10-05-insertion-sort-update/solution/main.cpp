#include <iostream>
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; ++i) cin >> a[i];

    // 初始名次：按 (值, 下标) 做稳定排序
    vector<pair<long long, int>> p(n);
    for (int i = 1; i <= n; ++i) p[i - 1] = {a[i], i};
    stable_sort(p.begin(), p.end());
    vector<int> rank(n + 1);
    for (int k = 0; k < n; ++k) rank[p[k].second] = k + 1;

    int q;
    cin >> q;
    while (q--) {
        int op;
        cin >> op;
        if (op == 1) {
            int x;
            long long v;
            cin >> x >> v;
            long long old = a[x];
            if (old == v) continue;

            // 一次 O(n) 更新：同时算 x 的新名次，并修正其它受影响元素的名次
            int r = 1;
            for (int i = 1; i <= n; ++i) {
                if (i == x) continue;
                // 修改前后，x 是否排在 i 前面
                bool before_old = (old < a[i]) || (old == a[i] && x < i);
                bool before_new = (v < a[i]) || (v == a[i] && x < i);
                if (before_old != before_new) rank[i] += (before_new ? 1 : -1);
                // 统计排在 x 前面的元素个数
                if (a[i] < v || (a[i] == v && i < x)) ++r;
            }
            rank[x] = r;
            a[x] = v;
        } else {
            int x;
            cin >> x;
            cout << rank[x] << '\n';
        }
    }
}
