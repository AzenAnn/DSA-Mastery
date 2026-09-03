#include <iostream>
#include <vector>
using namespace std;

void quickSort(vector<long long>& a, int left, int right) {
    if (left >= right) return;
    long long pivot = a[left + (right - left) / 2];
    int less = left, current = left, greater = right;
    while (current <= greater) {
        if (a[current] < pivot) swap(a[less++], a[current++]);
        else if (a[current] > pivot) swap(a[current], a[greater--]);
        else ++current;
    }
    quickSort(a, left, less - 1);
    quickSort(a, greater + 1, right);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> a(n);
    for (auto& value : a) cin >> value;
    if (n) quickSort(a, 0, n - 1);
    for (int i = 0; i < n; ++i) cout << (i ? " " : "") << a[i];
    cout << '\n';
}
