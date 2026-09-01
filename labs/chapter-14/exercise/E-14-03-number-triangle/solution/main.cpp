#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> dp(n, numeric_limits<long long>::lowest() / 4);
    cin >> dp[0];
    for (int row = 1; row < n; ++row) {
        vector<long long> next(row + 1, numeric_limits<long long>::lowest() / 4);
        for (int column = 0; column <= row; ++column) {
            long long value;
            cin >> value;
            if (column < row) next[column] = max(next[column], dp[column] + value);
            if (column > 0) next[column] = max(next[column], dp[column - 1] + value);
        }
        dp.swap(next);
    }
    cout << *max_element(dp.begin(), dp.end()) << '\n';
    return 0;
}
