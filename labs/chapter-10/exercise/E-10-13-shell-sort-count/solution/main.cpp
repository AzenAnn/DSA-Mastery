#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // 增量序列 3*g+1：1, 4, 13, 40, ...，只保留不超过 n 的
    vector<long long> gaps;
    for (long long g = 1; g <= n; g = 3 * g + 1) {
        gaps.push_back(g);
    }
    // 按从大到小使用 gap
    reverse(gaps.begin(), gaps.end());

    long long cnt = 0; // 插入时元素后移的次数（交换次数）
    for (long long g : gaps) {
        for (long long i = g; i < n; ++i) {
            long long v = a[i];
            long long j = i - g;
            while (j >= 0 && a[j] > v) {
                a[j + g] = a[j];
                j -= g;
                ++cnt;
            }
            a[j + g] = v;
        }
    }

    cout << gaps.size() << '\n';
    for (size_t i = 0; i < gaps.size(); ++i) {
        if (i) cout << ' ';
        cout << gaps[i];
    }
    cout << '\n';
    cout << cnt << '\n';
    for (long long x : a) cout << x << '\n';
    return 0;
}
