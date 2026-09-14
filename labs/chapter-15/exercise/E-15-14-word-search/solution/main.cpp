#include <array>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

bool solve(vector<string> board, const string& word) {
    int m = static_cast<int>(board.size()), n = static_cast<int>(board[0].size());
    if (word.size() > static_cast<size_t>(m * n)) return false;
    array<int, 128> available{};
    for (const auto& row : board)
        for (unsigned char ch : row) ++available[ch];
    for (unsigned char ch : word) if (--available[ch] < 0) return false;
    const array<int, 4> dx = {-1, 1, 0, 0}, dy = {0, 0, -1, 1};
    function<bool(int, int, int)> dfs = [&](int x, int y, int depth) {
        if (board[x][y] != word[depth]) return false;
        if (depth + 1 == static_cast<int>(word.size())) return true;
        char saved = board[x][y];
        board[x][y] = '#';
        bool found = false;
        for (int d = 0; d < 4 && !found; ++d) {
            int nx = x + dx[d], ny = y + dy[d];
            if (nx >= 0 && nx < m && ny >= 0 && ny < n)
                found = dfs(nx, ny, depth + 1);
        }
        board[x][y] = saved;
        return found;
    };
    for (int x = 0; x < m; ++x)
        for (int y = 0; y < n; ++y)
            if (dfs(x, y, 0)) return true;
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n;
    if (!(cin >> m >> n)) return 0;
    vector<string> board(m);
    for (string& row : board) cin >> row;
    string word;
    cin >> word;
    cout << (solve(board, word) ? "true" : "false") << '\n';
    return 0;
}
