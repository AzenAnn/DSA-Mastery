#include <bits/stdc++.h>
using namespace std;

void tile(int top, int left, int size, int holeRow, int holeCol) {
    if (size == 1) return;
    int half = size / 2;
    int middleRow = top + half;
    int middleCol = left + half;
    bool topHalf = holeRow < middleRow;
    bool leftHalf = holeCol < middleCol;
    if (topHalf && leftHalf) cout << middleRow + 1 << ' ' << middleCol + 1 << " 1\n";
    else if (topHalf) cout << middleRow + 1 << ' ' << middleCol << " 2\n";
    else if (leftHalf) cout << middleRow << ' ' << middleCol + 1 << " 3\n";
    else cout << middleRow << ' ' << middleCol << " 4\n";

    tile(top, left, half,
         topHalf && leftHalf ? holeRow : middleRow - 1,
         topHalf && leftHalf ? holeCol : middleCol - 1);
    tile(top, middleCol, half,
         topHalf && !leftHalf ? holeRow : middleRow - 1,
         topHalf && !leftHalf ? holeCol : middleCol);
    tile(middleRow, left, half,
         !topHalf && leftHalf ? holeRow : middleRow,
         !topHalf && leftHalf ? holeCol : middleCol - 1);
    tile(middleRow, middleCol, half,
         !topHalf && !leftHalf ? holeRow : middleRow,
         !topHalf && !leftHalf ? holeCol : middleCol);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int k, row, col;
    cin >> k >> row >> col;
    tile(0, 0, 1 << k, row - 1, col - 1);
    return 0;
}
