#include <array>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

long long solve(vector<vector<int>> blocked, int sx, int sy, int fx, int fy) {
    int n = static_cast<int>(blocked.size());
    int m = static_cast<int>(blocked[0].size());
    if (blocked[fx][fy]) return 0;
    const array<int, 4> dx = {-1, 1, 0, 0}, dy = {0, 0, -1, 1};
    function<long long(int, int)> dfs = [&](int x, int y) -> long long {
        if (x == fx && y == fy) return 1;
        blocked[x][y] = 1;
        long long count = 0;
        for (int direction = 0; direction < 4; ++direction) {
            int nx = x + dx[direction], ny = y + dy[direction];
            if (nx >= 0 && nx < n && ny >= 0 && ny < m && !blocked[nx][ny])
                count += dfs(nx, ny);
        }
        blocked[x][y] = 0;
        return count;
    };
    return dfs(sx, sy);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, t, sx, sy, fx, fy;
    if (!(cin >> n >> m >> t >> sx >> sy >> fx >> fy)) return 0;
    vector<vector<int>> blocked(n, vector<int>(m));
    while (t--) { int x, y; cin >> x >> y; blocked[x - 1][y - 1] = 1; }
    cout << solve(blocked, sx - 1, sy - 1, fx - 1, fy - 1) << '\n';
    return 0;
}
