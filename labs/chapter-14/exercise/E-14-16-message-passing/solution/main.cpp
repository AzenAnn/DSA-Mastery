#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<vector<long long>> grid(rows, vector<long long>(columns));
    for (auto& row : grid) for (long long& value : row) cin >> value;

    const long long negative = numeric_limits<long long>::lowest() / 4;
    vector<vector<long long>> dp(rows, vector<long long>(rows, negative));
    dp[0][0] = grid[0][0];
    for (int step = 1; step <= rows + columns - 2; ++step) {
        vector<vector<long long>> next(rows, vector<long long>(rows, negative));
        for (int x1 = 0; x1 < rows; ++x1) {
            int y1 = step - x1;
            if (y1 < 0 || y1 >= columns) continue;
            for (int x2 = 0; x2 < rows; ++x2) {
                int y2 = step - x2;
                if (y2 < 0 || y2 >= columns) continue;
                long long previous = negative;
                for (int fromX1 : {x1, x1 - 1}) {
                    for (int fromX2 : {x2, x2 - 1}) {
                        if (fromX1 >= 0 && fromX2 >= 0) previous = max(previous, dp[fromX1][fromX2]);
                    }
                }
                if (previous == negative) continue;
                long long gain = grid[x1][y1];
                if (x1 != x2) gain += grid[x2][y2];
                next[x1][x2] = previous + gain;
            }
        }
        dp.swap(next);
    }
    cout << dp[rows - 1][rows - 1] << '\n';
    return 0;
}
