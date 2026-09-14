#include <algorithm>
#include <functional>
#include <iostream>
#include <numeric>
#include <vector>

using namespace std;

int solve(vector<int> pieces) {
    (void)pieces;
    // TODO: find the shortest length that permits a partition of every piece.
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> pieces(n);
    for (int& length : pieces) cin >> length;
    cout << solve(pieces) << '\n';
    return 0;
}
