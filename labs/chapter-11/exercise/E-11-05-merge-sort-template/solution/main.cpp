#include <iostream>
#include <vector>
using namespace std;

// 合并两个有序区间 [l, mid) 与 [mid, r)，结果写回 a 的 [l, r)
void merge(vector<int>& a, vector<int>& tmp, int l, int mid, int r) {
    int i = l, j = mid, k = l;
    while (i < mid && j < r) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i < mid) tmp[k++] = a[i++];
    while (j < r) tmp[k++] = a[j++];
    for (int p = l; p < r; ++p) a[p] = tmp[p];
}

// 归并排序区间 [l, r)（左闭右开）
void merge_sort(vector<int>& a, vector<int>& tmp, int l, int r) {
    if (r - l <= 1) return;
    int mid = l + (r - l) / 2;
    merge_sort(a, tmp, l, mid);
    merge_sort(a, tmp, mid, r);
    merge(a, tmp, l, mid, r);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n), tmp(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    merge_sort(a, tmp, 0, n);

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
}
