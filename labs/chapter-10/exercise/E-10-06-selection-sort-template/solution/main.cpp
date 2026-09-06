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

    // 选择排序：每轮从未排序区间 [i, n-1] 选出最小值，放到位置 i
    for (int i = 0; i < n - 1; ++i) {
        int minj = i;
        for (int j = i + 1; j < n; ++j) {
            if (a[j] < a[minj]) minj = j;
        }
        swap(a[i], a[minj]);
    }

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
}
