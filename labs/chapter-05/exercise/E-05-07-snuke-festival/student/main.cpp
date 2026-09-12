#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> A(n), B(n), C(n);
    for (auto& x : A) cin >> x;
    for (auto& x : B) cin >> x;
    for (auto& x : C) cin >> x;
    // TODO: 排序 A 与 C
    long long ans = 0;
    // TODO: 对每个 b：x = A 中严格小于 b 的个数（lower_bound）；
    //       y = C 中严格大于 b 的个数（n - upper_bound）；
    //       ans += x * y
    cout << ans << '\n';
    return 0;
}
