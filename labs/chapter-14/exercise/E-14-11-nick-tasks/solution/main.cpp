#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int totalTime, taskCount;
    cin >> totalTime >> taskCount;
    vector<vector<int>> tasks(totalTime + 2);
    while (taskCount--) {
        int start, duration;
        cin >> start >> duration;
        tasks[start].push_back(duration);
    }
    vector<int> dp(totalTime + 2);
    for (int time = totalTime; time >= 1; --time) {
        if (tasks[time].empty()) {
            dp[time] = dp[time + 1] + 1;
        } else {
            for (int duration : tasks[time]) dp[time] = max(dp[time], dp[time + duration]);
        }
    }
    cout << dp[1] << '\n';
    return 0;
}
