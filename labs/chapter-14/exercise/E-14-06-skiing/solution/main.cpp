#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<vector<int>> height(rows, vector<int>(columns));
    for (auto& row : height) for (int& value : row) cin >> value;

    vector<vector<int>> memo(rows, vector<int>(columns));
    const array<int, 4> dx{1, -1, 0, 0};
    const array<int, 4> dy{0, 0, 1, -1};
    function<int(int, int)> dfs = [&](int x, int y) {
        if (memo[x][y] != 0) return memo[x][y];
        int best = 1;
        for (int direction = 0; direction < 4; ++direction) {
            int nx = x + dx[direction];
            int ny = y + dy[direction];
            if (nx >= 0 && nx < rows && ny >= 0 && ny < columns && height[nx][ny] < height[x][y]) {
                best = max(best, 1 + dfs(nx, ny));
            }
        }
        return memo[x][y] = best;
    };

    int answer = 0;
    for (int i = 0; i < rows; ++i) for (int j = 0; j < columns; ++j) answer = max(answer, dfs(i, j));
    cout << answer << '\n';
    return 0;
}
