#include <array>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<string> solve(vector<string> board) {
    array<int, 9> rows{}, cols{}, boxes{};
    for (int r = 0; r < 9; ++r) {
        for (int c = 0; c < 9; ++c) {
            if (board[r][c] == '.') continue;
            int bit = 1 << (board[r][c] - '1'), box = r / 3 * 3 + c / 3;
            rows[r] |= bit; cols[c] |= bit; boxes[box] |= bit;
        }
    }
    auto countBits = [](int mask) {
        int count = 0;
        for (; mask; mask &= mask - 1) ++count;
        return count;
    };
    function<bool()> dfs = [&]() {
        int bestR = -1, bestC = -1, bestMask = 0, fewest = 10;
        for (int r = 0; r < 9; ++r) {
            for (int c = 0; c < 9; ++c) {
                if (board[r][c] != '.') continue;
                int mask = 511 & ~(rows[r] | cols[c] | boxes[r / 3 * 3 + c / 3]);
                int count = countBits(mask);
                if (count == 0) return false;
                if (count < fewest) {
                    fewest = count; bestR = r; bestC = c; bestMask = mask;
                }
            }
        }
        if (bestR == -1) return true;
        int box = bestR / 3 * 3 + bestC / 3;
        for (int digit = 0; digit < 9; ++digit) {
            int bit = 1 << digit;
            if (!(bestMask & bit)) continue;
            board[bestR][bestC] = static_cast<char>('1' + digit);
            rows[bestR] |= bit; cols[bestC] |= bit; boxes[box] |= bit;
            if (dfs()) return true;
            rows[bestR] ^= bit; cols[bestC] ^= bit; boxes[box] ^= bit;
            board[bestR][bestC] = '.';
        }
        return false;
    };
    dfs();
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
