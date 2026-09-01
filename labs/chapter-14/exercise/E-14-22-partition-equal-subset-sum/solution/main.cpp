#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> values(n);
    int total = 0;
    for (int& value : values) {
        cin >> value;
        total += value;
    }
    if (total % 2 != 0) {
        cout << "NO\n";
        return 0;
    }
    int target = total / 2;
    vector<bool> possible(target + 1);
    possible[0] = true;
    for (int value : values) {
        for (int sum = target; sum >= value; --sum) possible[sum] = possible[sum] || possible[sum - value];
    }
    cout << (possible[target] ? "YES" : "NO") << '\n';
    return 0;
}
