#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // 增量序列 3*g+1：1, 4, 13, 40, ...，按从小到大顺序逐层做插入排序
    for (long long g = 1; g <= n; g = 3 * g + 1) {
        for (long long i = g; i < n; ++i) {
            long long v = a[i];
            long long j = i - g;
            while (j >= 0 && a[j] > v) {
                a[j + g] = a[j];
                j -= g;
            }
            a[j + g] = v;
        }
    }

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
    return 0;
}
