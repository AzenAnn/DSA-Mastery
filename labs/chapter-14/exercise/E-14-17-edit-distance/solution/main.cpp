#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string left, right;
    cin >> left >> right;
    if (left == "-") left.clear();
    if (right == "-") right.clear();

    vector<int> previous(right.size() + 1);
    iota(previous.begin(), previous.end(), 0);
    for (int i = 1; i <= static_cast<int>(left.size()); ++i) {
        vector<int> current(right.size() + 1);
        current[0] = i;
        for (int j = 1; j <= static_cast<int>(right.size()); ++j) {
            int replaceCost = left[i - 1] == right[j - 1] ? 0 : 1;
            current[j] = min({previous[j] + 1, current[j - 1] + 1, previous[j - 1] + replaceCost});
        }
        previous.swap(current);
    }
    cout << previous.back() << '\n';
    return 0;
}
