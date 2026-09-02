#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int totalTime, itemCount;
    cin >> totalTime >> itemCount;
    vector<long long> dp(totalTime + 1);
    while (itemCount--) {
        int time, value;
        cin >> time >> value;
        for (int capacity = totalTime; capacity >= time; --capacity) {
            dp[capacity] = max(dp[capacity], dp[capacity - time] + value);
        }
    }
    cout << dp[totalTime] << '\n';
    return 0;
}
