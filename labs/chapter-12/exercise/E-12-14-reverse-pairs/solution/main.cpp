#include <bits/stdc++.h>
using namespace std;

long long countPairs(vector<long long>& values, vector<long long>& buffer, int left, int right) {
    if (right - left <= 1) return 0;
    int middle = left + (right - left) / 2;
    long long answer = countPairs(values, buffer, left, middle) + countPairs(values, buffer, middle, right);
    int j = middle;
    for (int i = left; i < middle; ++i) {
        while (j < right && values[i] > 2LL * values[j]) ++j;
        answer += j - middle;
    }
    merge(values.begin() + left, values.begin() + middle, values.begin() + middle, values.begin() + right, buffer.begin() + left);
    copy(buffer.begin() + left, buffer.begin() + right, values.begin() + left);
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> values(n), buffer(n);
    for (long long& value : values) cin >> value;
    cout << countPairs(values, buffer, 0, n) << '\n';
    return 0;
}
