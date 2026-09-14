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
    sort(A.begin(), A.end());
    sort(C.begin(), C.end());
    long long ans = 0;
    for (long long b : B) {
        long long x = lower_bound(A.begin(), A.end(), b) - A.begin();   // 严格小于 b
        long long y = C.end() - upper_bound(C.begin(), C.end(), b);     // 严格大于 b
        ans += x * y;
    }
    cout << ans << '\n';
    return 0;
}
