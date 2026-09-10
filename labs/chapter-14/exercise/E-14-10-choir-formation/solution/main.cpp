#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> height(n);
    for (int& value : height) cin >> value;
    vector<int> left(n, 1), right(n, 1);
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < i; ++j) if (height[j] < height[i]) left[i] = max(left[i], left[j] + 1);
    }
    for (int i = n - 1; i >= 0; --i) {
        for (int j = n - 1; j > i; --j) if (height[j] < height[i]) right[i] = max(right[i], right[j] + 1);
    }
    int bestFormation = 0;
    for (int i = 0; i < n; ++i) bestFormation = max(bestFormation, left[i] + right[i] - 1);
    cout << n - bestFormation << '\n';
    return 0;
}
