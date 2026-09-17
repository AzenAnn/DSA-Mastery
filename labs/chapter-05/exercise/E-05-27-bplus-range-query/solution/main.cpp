#include <iostream>
#include <vector>
#include <algorithm>
#include <unordered_set>
using namespace std;

// 树状数组（Fenwick Tree）：维护离散化下标上的前缀和
struct Fenwick {
    int n;
    vector<int> t;
    void init(int n_) { n = n_; t.assign(n + 1, 0); }
    void add(int i, int v) { for (; i <= n; i += i & -i) t[i] += v; }
    int sum(int i) const { int r = 0; for (; i > 0; i -= i & -i) r += t[i]; return r; }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;

    // 先离线读入全部操作，收集所有出现过的数值用于离散化
    vector<char> op(n);
    vector<int> a(n), b(n), xs;
    for (int i = 0; i < n; ++i) {
        cin >> op[i] >> a[i];
        xs.push_back(a[i]);
        if (op[i] == 'Q') {
            cin >> b[i];
            xs.push_back(b[i]);
        }
    }
    sort(xs.begin(), xs.end());
    xs.erase(unique(xs.begin(), xs.end()), xs.end());

    Fenwick bit;
    bit.init((int)xs.size());
    unordered_set<int> seen;   // 去重：同一个关键字只计一次

    for (int i = 0; i < n; ++i) {
        if (op[i] == 'I') {
            if (seen.insert(a[i]).second) {
                int p = (int)(lower_bound(xs.begin(), xs.end(), a[i]) - xs.begin()) + 1;
                bit.add(p, 1);
            }
        } else {
            if (a[i] > b[i]) { cout << 0 << '\n'; continue; }   // 空区间
            // ≤ R 的个数 - < L 的个数
            int idxL = (int)(lower_bound(xs.begin(), xs.end(), a[i]) - xs.begin()) + 1;
            int idxR = (int)(upper_bound(xs.begin(), xs.end(), b[i]) - xs.begin());
            cout << bit.sum(idxR) - bit.sum(idxL - 1) << '\n';
        }
    }
    return 0;
}
