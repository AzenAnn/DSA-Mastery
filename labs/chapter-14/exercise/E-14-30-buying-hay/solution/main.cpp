#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int companyCount, target;
    cin >> companyCount >> target;
    vector<pair<int, int>> packages(companyCount);
    for (auto& [cost, weight] : packages) cin >> cost >> weight;
    const long long infinity = numeric_limits<long long>::max() / 4;
    vector<long long> dp(target + 1, infinity);
    dp[0] = 0;
    for (int weight = 0; weight < target; ++weight) {
        if (dp[weight] == infinity) continue;
        for (const auto& [cost, gain] : packages) {
            int nextWeight = min(target, weight + gain);
            dp[nextWeight] = min(dp[nextWeight], dp[weight] + cost);
        }
    }
    cout << dp[target] << '\n';
    return 0;
}
