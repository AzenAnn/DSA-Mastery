#include <iostream>
#include <vector>
using namespace std;

// LSD 基数排序：按十进制位从低位到高位，每轮用稳定计数排序处理当前位
void radixSort(vector<int>& a) {
    int n = (int)a.size();
    if (n == 0) return;
    vector<int> b(n);

    int maxv = 0;
    for (int x : a) if (x > maxv) maxv = x;

    // 逐位处理：exp = 1, 10, 100, ...
    for (long long exp = 1; maxv / exp > 0; exp *= 10) {
        int cnt[10] = {0};
        for (int x : a) cnt[(x / exp) % 10]++;

        // 前缀和：cnt[d] 变为「<= d 的个数」，即最后一个该位为 d 的元素的位置 + 1
        for (int i = 1; i < 10; ++i) cnt[i] += cnt[i - 1];

        // 从后往前放置，保证同一当前位的元素保持上一轮的相对顺序（稳定）
        for (int i = n - 1; i >= 0; --i) {
            int d = (a[i] / exp) % 10;
            b[--cnt[d]] = a[i];
        }
        a.swap(b);
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    radixSort(a);

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
    return 0;
}
