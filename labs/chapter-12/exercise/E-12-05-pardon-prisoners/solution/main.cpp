#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> board;

void pardon(int row, int col, int size) {
    if (size == 1) return;
    int half = size / 2;
    for (int i = row; i < row + half; ++i) {
        for (int j = col; j < col + half; ++j) board[i][j] = 0;
    }
    pardon(row, col + half, half);
    pardon(row + half, col, half);
    pardon(row + half, col + half, half);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    int size = 1 << n;
    board.assign(size, vector<int>(size, 1));
    pardon(0, 0, size);
    for (const auto& row : board) {
        for (int j = 0; j < size; ++j) cout << row[j] << (j + 1 == size ? '\n' : ' ');
    }
    return 0;
}
