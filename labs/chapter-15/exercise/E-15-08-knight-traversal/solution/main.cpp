#include <array>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

using namespace std;

vector<vector<int>> solve(int n, int m, int x, int y) {
    const array<int, 8> dx = {-2, -2, -1, -1, 1, 1, 2, 2};
    const array<int, 8> dy = {-1, 1, -2, 2, -2, 2, -1, 1};
    vector<vector<int>> distance(n, vector<int>(m, -1));
    queue<pair<int, int>> pending;
    distance[x][y] = 0;
    pending.push({x, y});
    while (!pending.empty()) {
        auto [cx, cy] = pending.front();
        pending.pop();
        for (int direction = 0; direction < 8; ++direction) {
            int nx = cx + dx[direction], ny = cy + dy[direction];
            if (nx < 0 || nx >= n || ny < 0 || ny >= m || distance[nx][ny] != -1)
                continue;
            distance[nx][ny] = distance[cx][cy] + 1;
            pending.push({nx, ny});
        }
    }
    return distance;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, x, y;
    if (!(cin >> n >> m >> x >> y)) return 0;
    auto distance = solve(n, m, x - 1, y - 1);
    for (const auto& row : distance) {
        for (int col = 0; col < m; ++col) cout << (col ? " " : "") << row[col];
        cout << '\n';
    }
    return 0;
}
