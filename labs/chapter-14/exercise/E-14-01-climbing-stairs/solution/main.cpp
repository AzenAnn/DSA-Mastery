#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long previous = 1;
    long long current = 1;
    for (int level = 1; level <= n; ++level) {
        long long next = previous + current;
        previous = current;
        current = next;
    }
    cout << previous << '\n';
    return 0;
}
