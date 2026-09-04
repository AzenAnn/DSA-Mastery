#include <bits/stdc++.h>
using namespace std;

void mergeSort(vector<int>& values, vector<int>& buffer, int left, int right) {
    if (right - left <= 1) return;
    int middle = left + (right - left) / 2;
    mergeSort(values, buffer, left, middle);
    mergeSort(values, buffer, middle, right);
    int i = left, j = middle, write = left;
    while (i < middle || j < right) {
        if (j == right || (i < middle && values[i] <= values[j])) buffer[write++] = values[i++];
        else buffer[write++] = values[j++];
    }
    copy(buffer.begin() + left, buffer.begin() + right, values.begin() + left);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> values(n), buffer(n);
    for (int& value : values) cin >> value;
    mergeSort(values, buffer, 0, n);
    for (int i = 0; i < n; ++i) cout << values[i] << (i + 1 == n ? '\n' : ' ');
    return 0;
}
