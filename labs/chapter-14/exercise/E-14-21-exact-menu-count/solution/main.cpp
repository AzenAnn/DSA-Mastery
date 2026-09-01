#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int itemCount, target;
    cin >> itemCount >> target;
    vector<long long> dp(target + 1);
    dp[0] = 1;
    while (itemCount--) {
        int price;
        cin >> price;
        for (int amount = target; amount >= price; --amount) dp[amount] += dp[amount - price];
    }
    cout << dp[target] << '\n';
    return 0;
}
