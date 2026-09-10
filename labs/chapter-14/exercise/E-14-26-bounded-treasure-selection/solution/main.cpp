#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int typeCount, capacity;
    cin >> typeCount >> capacity;
    vector<long long> dp(capacity + 1);
    while (typeCount--) {
        int value, weight, amount;
        cin >> value >> weight >> amount;
        for (int group = 1; amount > 0; group *= 2) {
            int take = min(group, amount);
            amount -= take;
            int groupWeight = weight * take;
            int groupValue = value * take;
            for (int space = capacity; space >= groupWeight; --space) {
                dp[space] = max(dp[space], dp[space - groupWeight] + groupValue);
            }
        }
    }
    cout << dp[capacity] << '\n';
    return 0;
}
