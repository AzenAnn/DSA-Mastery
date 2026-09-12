#include <array>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<string> solve(vector<string> board) {
    // TODO: fill the unique solution while preserving all clues.
    return board;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<string> board(9);
    for (string& row : board) if (!(cin >> row)) return 0;
    for (const string& row : solve(board)) cout << row << '\n';
    return 0;
}
