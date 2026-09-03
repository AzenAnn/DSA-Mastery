#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int targetX, targetY, horseX, horseY;
    cin >> targetX >> targetY >> horseX >> horseY;
    vector<vector<bool>> blocked(targetX + 1, vector<bool>(targetY + 1));
    const array<int, 9> dx{0, 1, 1, -1, -1, 2, 2, -2, -2};
    const array<int, 9> dy{0, 2, -2, 2, -2, 1, -1, 1, -1};
    for (int move = 0; move < 9; ++move) {
        int x = horseX + dx[move];
        int y = horseY + dy[move];
        if (x >= 0 && x <= targetX && y >= 0 && y <= targetY) blocked[x][y] = true;
    }

    vector<vector<long long>> dp(targetX + 1, vector<long long>(targetY + 1));
    if (!blocked[0][0]) dp[0][0] = 1;
    for (int x = 0; x <= targetX; ++x) {
        for (int y = 0; y <= targetY; ++y) {
            if (blocked[x][y] || (x == 0 && y == 0)) continue;
            if (x > 0) dp[x][y] += dp[x - 1][y];
            if (y > 0) dp[x][y] += dp[x][y - 1];
        }
    }
    cout << dp[targetX][targetY] << '\n';
    return 0;
}
