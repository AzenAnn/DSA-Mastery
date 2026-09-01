#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int typeCount, amount;
    cin >> typeCount >> amount;
    vector<int> coins(typeCount);
    for (int& coin : coins) cin >> coin;
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int coin : coins) {
        for (int sum = coin; sum <= amount; ++sum) dp[sum] = min(dp[sum], dp[sum - coin] + 1);
    }
    cout << (dp[amount] > amount ? -1 : dp[amount]) << '\n';
    return 0;
}
