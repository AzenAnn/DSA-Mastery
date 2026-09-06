#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int capacity, itemCount;
    cin >> capacity >> itemCount;
    vector<int> dp(capacity + 1);
    while (itemCount--) {
        int volume;
        cin >> volume;
        for (int space = capacity; space >= volume; --space) {
            dp[space] = max(dp[space], dp[space - volume] + volume);
        }
    }
    cout << capacity - dp[capacity] << '\n';
    return 0;
}
