#include <iostream>
#include <queue>
#include <vector>

using namespace std;

int solve(const vector<int>& jumps, int start, int goal) {
    (void)jumps; (void)start; (void)goal;
    // TODO: find the minimum number of button presses.
    return -1;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, a, b;
    if (!(cin >> n >> a >> b)) return 0;
    vector<int> jumps(n);
    for (int& jump : jumps) cin >> jump;
    cout << solve(jumps, a - 1, b - 1) << '\n';
    return 0;
}
