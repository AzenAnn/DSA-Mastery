#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<long long> dp(columns, 1);
    for (int row = 1; row < rows; ++row) {
        for (int column = 1; column < columns; ++column) dp[column] += dp[column - 1];
    }
    cout << dp.back() << '\n';
    return 0;
}
