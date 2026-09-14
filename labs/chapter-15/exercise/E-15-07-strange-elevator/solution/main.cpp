#include <iostream>
#include <queue>
#include <vector>

using namespace std;

int solve(const vector<int>& jumps, int start, int goal) {
    int n = static_cast<int>(jumps.size());
    vector<int> distance(n, -1);
    queue<int> pending;
    distance[start] = 0;
    pending.push(start);
    while (!pending.empty()) {
        int current = pending.front();
        pending.pop();
        if (current == goal) return distance[current];
        for (int next : {current - jumps[current], current + jumps[current]}) {
            if (next < 0 || next >= n || distance[next] != -1) continue;
            distance[next] = distance[current] + 1;
            pending.push(next);
        }
    }
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
