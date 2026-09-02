#include <bits/stdc++.h>
using namespace std;

int toMinutes(const string& clock) {
    int separator = static_cast<int>(clock.find(':'));
    return stoi(clock.substr(0, separator)) * 60 + stoi(clock.substr(separator + 1));
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string startClock, endClock;
    int typeCount;
    cin >> startClock >> endClock >> typeCount;
    int totalTime = toMinutes(endClock) - toMinutes(startClock);
    vector<long long> dp(totalTime + 1);
    while (typeCount--) {
        int time, value, amount;
        cin >> time >> value >> amount;
        if (amount == 0) {
            for (int space = time; space <= totalTime; ++space) {
                dp[space] = max(dp[space], dp[space - time] + value);
            }
            continue;
        }
        for (int group = 1; amount > 0; group *= 2) {
            int take = min(group, amount);
            amount -= take;
            int groupTime = time * take;
            int groupValue = value * take;
            for (int space = totalTime; space >= groupTime; --space) {
                dp[space] = max(dp[space], dp[space - groupTime] + groupValue);
            }
        }
    }
    cout << dp[totalTime] << '\n';
    return 0;
}
