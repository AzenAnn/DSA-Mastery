#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n), b(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // LSD 基数排序：值域 0..999，正好按个位、十位、百位做 3 轮
    for (int exp = 1; exp <= 100; exp *= 10) {
        int cnt[10] = {0};
        for (int x : a) cnt[(x / exp) % 10]++;
        for (int i = 1; i < 10; ++i) cnt[i] += cnt[i - 1];

        // 从后往前放置，保证稳定
        for (int i = n - 1; i >= 0; --i) {
            int d = (a[i] / exp) % 10;
            b[--cnt[d]] = a[i];
        }
        a.swap(b);

        // 输出本轮排序后的数组
        for (int i = 0; i < n; ++i) {
            if (i) cout << ' ';
            cout << a[i];
        }
        cout << '\n';
    }
    return 0;
}
