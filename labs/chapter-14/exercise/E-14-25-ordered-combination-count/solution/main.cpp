#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int count, target;
    cin >> count >> target;
    vector<int> values(count);
    for (int& value : values) cin >> value;
    vector<long long> dp(target + 1);
    dp[0] = 1;
    for (int sum = 1; sum <= target; ++sum) {
        for (int value : values) if (value <= sum) dp[sum] += dp[sum - value];
    }
    cout << dp[target] << '\n';
    return 0;
}
