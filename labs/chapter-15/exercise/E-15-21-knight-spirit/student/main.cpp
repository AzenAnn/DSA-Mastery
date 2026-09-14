#include <algorithm>
#include <array>
#include <functional>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

int solve(string state) {
    (void)state;
    // TODO: return the minimum distance when it is at most 15.
    return -1;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    if (!(cin >> t)) return 0;
    while (t--) {
        string state, row;
        for (int r = 0; r < 5; ++r) { cin >> row; state += row; }
        cout << solve(state) << '\n';
    }
    return 0;
}
