#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    const long long infinity = numeric_limits<long long>::max() / 4;
    vector<long long> dp(columns, infinity);
    for (int row = 0; row < rows; ++row) {
        for (int column = 0; column < columns; ++column) {
            long long value;
            cin >> value;
            if (row == 0 && column == 0) dp[column] = value;
            else dp[column] = value + min(dp[column], column > 0 ? dp[column - 1] : infinity);
        }
    }
    cout << dp.back() << '\n';
    return 0;
}
