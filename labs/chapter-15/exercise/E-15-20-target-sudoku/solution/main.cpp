#include <algorithm>
#include <array>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

int solve(vector<vector<int>> board) {
    array<int, 9> rows{}, cols{}, boxes{};
    int score = 0, answer = -1;
    auto weight = [](int r, int c) { return 6 + min({r, c, 8 - r, 8 - c}); };
    for (int r = 0; r < 9; ++r) {
        for (int c = 0; c < 9; ++c) {
            int digit = board[r][c];
            if (!digit) continue;
            int bit = 1 << (digit - 1), box = r / 3 * 3 + c / 3;
            if ((rows[r] | cols[c] | boxes[box]) & bit) return -1;
            rows[r] |= bit; cols[c] |= bit; boxes[box] |= bit;
            score += digit * weight(r, c);
        }
    }
    auto countBits = [](int mask) {
        int count = 0;
        for (; mask; mask &= mask - 1) ++count;
        return count;
    };
    function<void(int)> dfs = [&](int currentScore) {
        int bestR = -1, bestC = -1, bestMask = 0, fewest = 10, upper = currentScore;
        for (int r = 0; r < 9; ++r) {
            for (int c = 0; c < 9; ++c) {
                if (board[r][c]) continue;
                int mask = 511 & ~(rows[r] | cols[c] | boxes[r / 3 * 3 + c / 3]);
                int count = countBits(mask);
                if (!count) return;
                int largest = 9;
                while (!(mask & (1 << (largest - 1)))) --largest;
                upper += largest * weight(r, c);
                if (count < fewest ||
                    (count == fewest && weight(r, c) > weight(bestR, bestC))) {
                    fewest = count; bestR = r; bestC = c; bestMask = mask;
                }
            }
        }
        if (upper <= answer) return;
        if (bestR == -1) {
            answer = max(answer, currentScore);
            return;
        }
        int box = bestR / 3 * 3 + bestC / 3;
        for (int digit = 9; digit >= 1; --digit) {
            int bit = 1 << (digit - 1);
            if (!(bestMask & bit)) continue;
            board[bestR][bestC] = digit;
            rows[bestR] |= bit; cols[bestC] |= bit; boxes[box] |= bit;
            dfs(currentScore + digit * weight(bestR, bestC));
            rows[bestR] ^= bit; cols[bestC] ^= bit; boxes[box] ^= bit;
            board[bestR][bestC] = 0;
        }
    };
    dfs(score);
    return answer;
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
