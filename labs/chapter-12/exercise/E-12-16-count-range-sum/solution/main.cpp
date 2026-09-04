#include <bits/stdc++.h>
using namespace std;

long long lowerBoundValue, upperBoundValue;

long long countRange(vector<long long>& prefix, vector<long long>& buffer, int left, int right) {
    if (right - left <= 1) return 0;
    int middle = left + (right - left) / 2;
    long long answer = countRange(prefix, buffer, left, middle) + countRange(prefix, buffer, middle, right);
    int lower = middle, upper = middle;
    for (int i = left; i < middle; ++i) {
        while (lower < right && prefix[lower] - prefix[i] < lowerBoundValue) ++lower;
        while (upper < right && prefix[upper] - prefix[i] <= upperBoundValue) ++upper;
        answer += upper - lower;
    }
    merge(prefix.begin() + left, prefix.begin() + middle, prefix.begin() + middle, prefix.begin() + right, buffer.begin() + left);
    copy(buffer.begin() + left, buffer.begin() + right, prefix.begin() + left);
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n >> lowerBoundValue >> upperBoundValue;
    vector<long long> prefix(n + 1, 0), buffer(n + 1);
    for (int i = 1; i <= n; ++i) {
        long long value;
        cin >> value;
        prefix[i] = prefix[i - 1] + value;
    }
    cout << countRange(prefix, buffer, 0, n + 1) << '\n';
    return 0;
}
