#include <algorithm>
#include <array>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <limits>
#include <numeric>
#include <queue>
#include <string>
#include <tuple>
#include <unordered_map>
#include <utility>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, cols;
    if (!(cin >> rows >> cols)) return 0;
    vector<vector<int>> grid(rows, vector<int>(cols));
    for (auto& row : grid) for (int& cell : row) cin >> cell;

    if (grid[0][0] || grid[rows - 1][cols - 1]) { cout << "-1\n"; return 0; }
    const int INF = numeric_limits<int>::max() / 4;
    vector<int> distance(rows * cols, INF);
    using State = tuple<int, int, int>; // f, g, 编号
    priority_queue<State, vector<State>, greater<State>> open;
    distance[0] = 0;
    open.push({rows + cols - 2, 0, 0});
    const int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!open.empty()) {
        auto [f, g, u] = open.top(); open.pop();
        (void)f;
        if (g != distance[u]) continue;
        if (u == rows * cols - 1) { cout << g << '\n'; return 0; }
        int r = u / cols, c = u % cols;
        for (int k = 0; k < 4; ++k) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc]) continue;
            int v = nr * cols + nc;
            if (g + 1 < distance[v]) {
                distance[v] = g + 1;
                open.push({g + 1 + rows - 1 - nr + cols - 1 - nc, g + 1, v});
            }
        }
    }
    cout << "-1\n";
    return 0;
}
