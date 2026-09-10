#include <bits/stdc++.h>
using namespace std;

vector<int> beautiful(int n) {
    if (n == 1) return {1};
    vector<int> result;
    for (int value : beautiful((n + 1) / 2)) result.push_back(value * 2 - 1);
    for (int value : beautiful(n / 2)) result.push_back(value * 2);
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> answer = beautiful(n);
    for (int i = 0; i < n; ++i) cout << answer[i] << (i + 1 == n ? '\n' : ' ');
    return 0;
}
