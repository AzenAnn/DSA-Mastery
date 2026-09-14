#include <algorithm>
#include <functional>
#include <iostream>
#include <numeric>
#include <vector>

using namespace std;

int solve(vector<int> pieces) {
    sort(pieces.begin(), pieces.end(), greater<int>());
    int total = accumulate(pieces.begin(), pieces.end(), 0);
    int n = static_cast<int>(pieces.size());
    for (int target = pieces.front(); target <= total; ++target) {
        if (total % target != 0) continue;
        vector<bool> used(n, false);
        int stickCount = total / target;
        function<bool(int, int, int)> dfs = [&](int completed, int length, int start) {
            if (completed == stickCount - 1) return true;
            if (length == target) return dfs(completed + 1, 0, 0);
            int failedLength = -1;
            for (int i = start; i < n; ++i) {
                if (used[i] || pieces[i] == failedLength || length + pieces[i] > target) continue;
                used[i] = true;
                if (dfs(completed, length + pieces[i], i + 1)) return true;
                used[i] = false;
                failedLength = pieces[i];
                // Relabeling equal target sticks cannot rescue these failed branches.
                if (length == 0 || length + pieces[i] == target) return false;
            }
            return false;
        };
        if (dfs(0, 0, 0)) return target;
    }
    return total;
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
