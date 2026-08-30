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

    // TODO: 维护 rank[i] = a[i] 在当前数组做「稳定排序」后的名次（从 1 起）。
    // 1) 初始：把 (a[i], i) 按稳定排序排一次，得到每个位置的初始名次（O(n log n)）。
    // 2) 操作 2 x：直接输出 rank[x]（O(1)）。
    // 3) 操作 1 x v：把 a[x] 从 old 改成 v，一次 O(n) 更新——
    //    - x 的新名次 = 1 + 「值 < v 的个数」+「值 == v 且下标 < x 的个数」；
    //    - 对每个 i != x：看修改前后 x 是否排在 i 前面，
    //      据此让 rank[i] 加一、减一或不变。
    // 提示：元素 i 排在 x 前面 当且仅当 (a[i] < a[x]) 或 (a[i] == a[x] 且 i < x)。

    int q;
    cin >> q;
    while (q--) {
        int op;
        cin >> op;
        if (op == 1) {
            int x;
            long long v;
            cin >> x >> v;
            // TODO: 更新 a[x]，并维护 rank[]。
        } else {
            int x;
            cin >> x;
            // TODO: 输出 rank[x]。
        }
    }
    return 0;
}
