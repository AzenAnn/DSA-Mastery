#include <iostream>
#include <vector>
using namespace std;

long long candidate(const vector<long long>& a, int left, int right) {
    if (left == right) return a[left];
    int mid = left + (right - left) / 2;
    long long x = candidate(a, left, mid);
    long long y = candidate(a, mid + 1, right);
    if (x == y) return x;
    int countX = 0, countY = 0;
    for (int i = left; i <= right; ++i) {
        if (a[i] == x) ++countX;
        if (a[i] == y) ++countY;
    }
    return countX >= countY ? x : y;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> a(n);
    for (auto& value : a) cin >> value;
    if (!n) { cout << "NONE\n"; return 0; }
    long long answer = candidate(a, 0, n - 1);
    int count = 0;
    for (long long value : a) if (value == answer) ++count;
    if (count > n / 2) cout << answer << '\n'; else cout << "NONE\n";
}
