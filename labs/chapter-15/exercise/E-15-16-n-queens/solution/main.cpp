#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<vector<string>> solve(int n) {
    vector<vector<string>> answers;
    vector<string> board(n, string(n, '.'));
    vector<bool> columns(n, false), descending(2 * n - 1, false), ascending(2 * n - 1, false);
    function<void(int)> dfs = [&](int row) {
        if (row == n) {
            answers.push_back(board);
            return;
        }
        for (int col = 0; col < n; ++col) {
            int d = row - col + n - 1, a = row + col;
            if (columns[col] || descending[d] || ascending[a]) continue;
            board[row][col] = 'Q';
            columns[col] = descending[d] = ascending[a] = true;
            dfs(row + 1);
            columns[col] = descending[d] = ascending[a] = false;
            board[row][col] = '.';
        }
    };
    dfs(0);
    return answers;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    auto answers = solve(n);
    sort(answers.begin(), answers.end(), [](const auto& a, const auto& b) {
        for (size_t row = 0; row < a.size(); ++row) {
            auto ca = a[row].find('Q'), cb = b[row].find('Q');
            if (ca != cb) return ca < cb;
        }
        return false;
    });
    cout << answers.size() << '\n';
    for (const auto& board : answers)
        for (const string& row : board) cout << row << '\n';
    return 0;
}
