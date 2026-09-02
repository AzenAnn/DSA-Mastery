#include <iostream>
#include <vector>
using namespace std;

void mergeSort(vector<long long>& a, vector<long long>& temp, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    mergeSort(a, temp, left, mid);
    mergeSort(a, temp, mid + 1, right);
    int i = left, j = mid + 1, k = left;
    while (i <= mid && j <= right) temp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i <= mid) temp[k++] = a[i++];
    while (j <= right) temp[k++] = a[j++];
    for (int p = left; p <= right; ++p) a[p] = temp[p];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> a(n), temp(n);
    for (auto& value : a) cin >> value;
    if (n) mergeSort(a, temp, 0, n - 1);
    for (int i = 0; i < n; ++i) cout << (i ? " " : "") << a[i];
    cout << '\n';
}
