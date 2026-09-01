#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用快速排序把 a 从小到大排序。
    // 提示：写一个 quick_sort(a, l, r)，在区间内取基准 pivot，
    //   用三路划分维护三段——[l, i) 小于 pivot、[i, j] 等于 pivot、(j, r] 大于 pivot，
    //   再递归排序 [l, i-1] 和 [j+1, r]。
    // 基准可以取区间中点 a[l + (r - l) / 2]，避免升序/降序输入退化。

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
    return 0;
}
