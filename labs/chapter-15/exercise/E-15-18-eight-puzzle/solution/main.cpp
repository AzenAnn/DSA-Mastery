#include <algorithm>
#include <array>
#include <iostream>
#include <queue>
#include <string>
#include <unordered_map>

using namespace std;

int solve(const string& initial) {
    const string goal = "123804765";
    queue<string> pending;
    unordered_map<string, int> distance;
    distance.reserve(200000);
    pending.push(initial);
    distance.emplace(initial, 0);
    const array<int, 4> dx = {-1, 1, 0, 0}, dy = {0, 0, -1, 1};
    while (!pending.empty()) {
        string state = pending.front();
        pending.pop();
        int depth = distance.at(state);
        if (state == goal) return depth;
        int zero = static_cast<int>(state.find('0'));
        for (int d = 0; d < 4; ++d) {
            int r = zero / 3 + dx[d], c = zero % 3 + dy[d];
            if (r < 0 || r >= 3 || c < 0 || c >= 3) continue;
            string next = state;
            swap(next[zero], next[r * 3 + c]);
            if (distance.emplace(next, depth + 1).second) pending.push(next);
        }
    }
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
