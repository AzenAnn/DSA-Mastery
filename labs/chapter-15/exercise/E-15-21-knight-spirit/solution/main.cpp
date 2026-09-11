#include <algorithm>
#include <array>
#include <functional>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

int solve(string state) {
    const string goal = "111110111100*110000100000";
    const array<int, 8> dx = {-2, -2, -1, -1, 1, 1, 2, 2};
    const array<int, 8> dy = {-1, 1, -2, 2, -2, 2, -1, 1};
    array<vector<int>, 25> moves;
    for (int p = 0; p < 25; ++p) {
        for (int d = 0; d < 8; ++d) {
            int r = p / 5 + dx[d], c = p % 5 + dy[d];
            if (r >= 0 && r < 5 && c >= 0 && c < 5) moves[p].push_back(r * 5 + c);
        }
    }
    auto estimate = [&]() {
        int wrong = 0;
        for (int p = 0; p < 25; ++p)
            if (state[p] != '*' && state[p] != goal[p]) ++wrong;
        return wrong;
    };
    int zero = static_cast<int>(state.find('*'));
    for (int limit = estimate(); limit <= 15; ++limit) {
        unordered_map<string, int> shallowest;
        function<bool(int, int, int)> dfs = [&](int blank, int previous, int depth) {
            int remaining = estimate();
            if (!remaining) return true;
            if (depth + remaining > limit) return false;
            auto old = shallowest.find(state);
            if (old != shallowest.end() && old->second <= depth) return false;
            shallowest[state] = depth;
            for (int next : moves[blank]) {
                if (next == previous) continue;
                swap(state[blank], state[next]);
                bool found = dfs(next, blank, depth + 1);
                swap(state[blank], state[next]);
                if (found) return true;
            }
            return false;
        };
        if (dfs(zero, -1, 0)) return limit;
    }
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
