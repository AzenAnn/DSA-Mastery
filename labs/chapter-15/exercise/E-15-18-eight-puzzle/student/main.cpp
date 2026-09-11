#include <algorithm>
#include <array>
#include <iostream>
#include <queue>
#include <string>
#include <unordered_map>

using namespace std;

int solve(const string& initial) {
    (void)initial;
    // TODO: find the shortest path to 123804765.
    return -1;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string state;
    if (!(cin >> state)) return 0;
    cout << solve(state) << '\n';
    return 0;
}
