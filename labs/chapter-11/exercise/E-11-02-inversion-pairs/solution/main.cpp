#include <iostream>
#include <vector>
using namespace std;

long long cnt = 0;

// 归并排序 [l, r]，同时统计逆序对
void merge_sort(vector<int>& a, vector<int>& tmp, int l, int r) {
    if (l >= r) return;
    int mid = (l + r) >> 1;
    merge_sort(a, tmp, l, mid);
    merge_sort(a, tmp, mid + 1, r);

    int i = l, j = mid + 1, k = l;
    while (i <= mid && j <= r) {
        if (a[i] <= a[j]) {
            tmp[k++] = a[i++];
        } else {
            tmp[k++] = a[j++];
            cnt += mid - i + 1; // 右半 a[j] 比左半剩余所有元素都小
        }
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= r) tmp[k++] = a[j++];
    for (int p = l; p <= r; ++p) a[p] = tmp[p];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n), tmp(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    merge_sort(a, tmp, 0, n - 1);
    cout << cnt << '\n';
}
