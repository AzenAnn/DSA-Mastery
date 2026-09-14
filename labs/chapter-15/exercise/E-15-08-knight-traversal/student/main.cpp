#include <array>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

using namespace std;

vector<vector<int>> solve(int n, int m, int x, int y) {
    (void)x; (void)y;
    // TODO: compute all knight distances.
    return vector<vector<int>>(n, vector<int>(m, -1));
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
