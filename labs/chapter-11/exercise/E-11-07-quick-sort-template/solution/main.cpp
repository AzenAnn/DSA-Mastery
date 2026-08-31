#include <iostream>
#include <vector>
using namespace std;

// 三路划分快速排序：[l, i) < pivot，[i, j] == pivot，(j, r] > pivot
void quick_sort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int pivot = a[l + (r - l) / 2];
    int i = l, j = r, k = l;
    while (k <= j) {
        if (a[k] < pivot) {
            swap(a[i], a[k]);
            ++i;
            ++k;
        } else if (a[k] > pivot) {
            swap(a[k], a[j]);
            --j;
        } else {
            ++k;
        }
    }
    quick_sort(a, l, i - 1);
    quick_sort(a, j + 1, r);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    quick_sort(a, 0, n - 1);

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
}
