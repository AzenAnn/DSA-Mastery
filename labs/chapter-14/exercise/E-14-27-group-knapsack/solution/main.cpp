#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int capacity, itemCount;
    cin >> capacity >> itemCount;
    map<int, vector<pair<int, int>>> groups;
    while (itemCount--) {
        int weight, value, group;
        cin >> weight >> value >> group;
        groups[group].push_back({weight, value});
    }

    vector<long long> dp(capacity + 1);
    for (const auto& [group, items] : groups) {
        vector<long long> previous = dp;
        for (int space = 0; space <= capacity; ++space) {
            for (const auto& [weight, value] : items) {
                if (weight <= space) dp[space] = max(dp[space], previous[space - weight] + value);
            }
        }
    }
    cout << dp[capacity] << '\n';
    return 0;
}
