#include <iostream>
#include <vector>
using namespace std;

long long selectAt(vector<long long>& a, int left, int right, int target) {
    if (left == right) return a[left];
    long long pivot = a[left + (right - left) / 2];
    int less = left, current = left, greater = right;
    while (current <= greater) {
        if (a[current] < pivot) swap(a[less++], a[current++]);
        else if (a[current] > pivot) swap(a[current], a[greater--]);
        else ++current;
    }
    if (target < less) return selectAt(a, left, less - 1, target);
    if (target > greater) return selectAt(a, greater + 1, right, target);
    return pivot;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    if (!(cin >> n >> k)) return 0;
    vector<long long> a(n);
    for (auto& value : a) cin >> value;
    cout << selectAt(a, 0, n - 1, n - k) << '\n';
}
