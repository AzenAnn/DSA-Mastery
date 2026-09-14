#include <array>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

long long solve(vector<vector<int>> blocked, int sx, int sy, int fx, int fy) {
    (void)blocked;
    (void)sx; (void)sy; (void)fx; (void)fy;
    // TODO: count simple paths and restore visited cells.
    return 0;
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
