#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    const int MAXV = 1000000; // 值域 0..10^6
    vector<int> cnt(MAXV + 1, 0); // 按值域分桶：每个值一个桶

    int n;
    cin >> n;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        ++cnt[x];
    }

    bool first = true;
    for (int i = 0; i <= MAXV; ++i) {
        for (int k = 0; k < cnt[i]; ++k) {
            if (!first) cout << ' ';
            cout << i;
            first = false;
        }
    }
    cout << '\n';
}
