#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long twoBack = 0;
    long long oneBack = 0;
    for (int i = 0; i < n; ++i) {
        long long value;
        cin >> value;
        long long current = max(oneBack, twoBack + value);
        twoBack = oneBack;
        oneBack = current;
    }
    cout << oneBack << '\n';
    return 0;
}
