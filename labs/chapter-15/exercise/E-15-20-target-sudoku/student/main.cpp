#include <algorithm>
#include <array>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

int solve(vector<vector<int>> board) {
    (void)board;
    // TODO: maximize the weighted score across all valid completions.
    return -1;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<vector<int>> board(9, vector<int>(9));
    for (auto& row : board)
        for (int& digit : row) if (!(cin >> digit)) return 0;
    cout << solve(board) << '\n';
    return 0;
}
