#include <array>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

bool solve(vector<string> board, const string& word) {
    (void)board; (void)word;
    // TODO: find a path without reusing a cell.
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
