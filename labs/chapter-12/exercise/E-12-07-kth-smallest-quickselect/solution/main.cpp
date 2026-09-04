#include <bits/stdc++.h>
using namespace std;

int selectK(vector<int>& values, int left, int right, int k) {
    int pivot = values[left + (right - left) / 2];
    int less = left, current = left, greater = right;
    while (current <= greater) {
        if (values[current] < pivot) swap(values[less++], values[current++]);
        else if (values[current] > pivot) swap(values[current], values[greater--]);
        else ++current;
    }
    if (k < less) return selectK(values, left, less - 1, k);
    if (k > greater) return selectK(values, greater + 1, right, k);
    return pivot;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> values(n);
    for (int& value : values) cin >> value;
    cout << selectK(values, 0, n - 1, k) << '\n';
    return 0;
}
