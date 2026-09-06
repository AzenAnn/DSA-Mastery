#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    sort(a.begin(), a.end());
    a.erase(unique(a.begin(), a.end()), a.end());

    if ((int)a.size() < k) {
        cout << "NO RESULT\n";
    } else {
        cout << a[k - 1] << '\n';
    }
    return 0;
}
