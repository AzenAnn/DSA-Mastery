#include <iostream>
#include <vector>
using namespace std;

// 合并两个有序子数组 [l, mid] 与 [mid+1, r]
void merge(vector<int>& a, vector<int>& tmp, int l, int mid, int r) {
    int i = l, j = mid + 1, k = l;
    while (i <= mid && j <= r) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= r) tmp[k++] = a[j++];
    for (int p = l; p <= r; ++p) a[p] = tmp[p];
}

// 归并排序 [l, r]
void merge_sort(vector<int>& a, vector<int>& tmp, int l, int r) {
    if (l >= r) return;
    int mid = (l + r) >> 1;
    merge_sort(a, tmp, l, mid);
    merge_sort(a, tmp, mid + 1, r);
    merge(a, tmp, l, mid, r);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n), tmp(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    merge_sort(a, tmp, 0, n - 1);

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
}
