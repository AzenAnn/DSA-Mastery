#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<long long> dp(columns);
    for (int row = 0; row < rows; ++row) {
        for (int column = 0; column < columns; ++column) {
            int obstacle;
            cin >> obstacle;
            if (obstacle) dp[column] = 0;
            else if (row == 0 && column == 0) dp[column] = 1;
            else if (column > 0) dp[column] += dp[column - 1];
        }
    }
    cout << dp.back() << '\n';
    return 0;
}
