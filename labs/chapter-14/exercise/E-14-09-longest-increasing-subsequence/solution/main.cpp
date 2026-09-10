#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> values(n);
    for (int& value : values) cin >> value;
    vector<int> dp(n, 1);
    int answer = 1;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < i; ++j) {
            if (values[j] < values[i]) dp[i] = max(dp[i], dp[j] + 1);
        }
        answer = max(answer, dp[i]);
    }
    cout << answer << '\n';
    return 0;
}
