#include <bits/stdc++.h>
using namespace std;

vector<string> build(int level) {
    if (level == 1) return {" /\\", "/__\\"};
    vector<string> previous = build(level - 1);
    int oldHeight = static_cast<int>(previous.size());
    int oldWidth = oldHeight * 2;
    vector<string> result(oldHeight * 2, string(oldWidth * 2, ' '));
    for (int row = 0; row < oldHeight; ++row) {
        result[row].replace(oldHeight, previous[row].size(), previous[row]);
        result[row + oldHeight].replace(0, previous[row].size(), previous[row]);
        result[row + oldHeight].replace(oldWidth, previous[row].size(), previous[row]);
    }
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    for (string row : build(n)) {
        while (!row.empty() && row.back() == ' ') row.pop_back();
        cout << row << '\n';
    }
    return 0;
}
