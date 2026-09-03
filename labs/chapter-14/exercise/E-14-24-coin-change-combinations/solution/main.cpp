#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int typeCount, amount;
    cin >> typeCount >> amount;
    vector<int> coins(typeCount);
    for (int& coin : coins) cin >> coin;
    vector<long long> dp(amount + 1);
    dp[0] = 1;
    for (int coin : coins) {
        for (int sum = coin; sum <= amount; ++sum) dp[sum] += dp[sum - coin];
    }
    cout << dp[amount] << '\n';
    return 0;
}
