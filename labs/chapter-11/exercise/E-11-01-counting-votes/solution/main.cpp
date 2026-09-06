#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;

    vector<int> cnt(m + 1, 0);
    for (int i = 0; i < n; ++i) {
        int v;
        cin >> v;
        cnt[v]++;
    }

    bool first = true;
    for (int i = 1; i <= m; ++i) {
        while (cnt[i]-- > 0) {
            if (!first) cout << ' ';
            cout << i;
            first = false;
        }
    }
    cout << '\n';
}
