#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> cost(n);
    for (long long& value : cost) cin >> value;

    long long twoBack = 0;
    long long oneBack = 0;
    for (int position = 2; position <= n; ++position) {
        long long current = min(oneBack + cost[position - 1], twoBack + cost[position - 2]);
        twoBack = oneBack;
        oneBack = current;
    }
    cout << oneBack << '\n';
    return 0;
}
