#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int totalTime, typeCount;
    cin >> totalTime >> typeCount;
    vector<long long> dp(totalTime + 1);
    while (typeCount--) {
        int time, value;
        cin >> time >> value;
        for (int capacity = time; capacity <= totalTime; ++capacity) {
            dp[capacity] = max(dp[capacity], dp[capacity - time] + value);
        }
    }
    cout << dp[totalTime] << '\n';
    return 0;
}
