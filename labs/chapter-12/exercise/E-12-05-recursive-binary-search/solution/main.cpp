#include <iostream>
#include <vector>
using namespace std;

int firstOccurrence(const vector<long long>& a, long long target, int left, int right) {
    if (left > right) return -1;
    int mid = left + (right - left) / 2;
    if (a[mid] >= target) {
        int earlier = firstOccurrence(a, target, left, mid - 1);
        if (earlier != -1) return earlier;
        return a[mid] == target ? mid : -1;
    }
    return firstOccurrence(a, target, mid + 1, right);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long target;
    if (!(cin >> n >> target)) return 0;
    vector<long long> a(n);
    for (auto& value : a) cin >> value;
    cout << firstOccurrence(a, target, 0, n - 1) << '\n';
}
