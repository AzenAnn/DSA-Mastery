#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<vector<string>> solve(int n) {
    (void)n;
    // TODO: return all non-attacking queen boards.
    return {};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    auto answers = solve(n);
    sort(answers.begin(), answers.end(), [](const auto& a, const auto& b) {
        for (size_t row = 0; row < a.size(); ++row) {
            auto ca = a[row].find('Q'), cb = b[row].find('Q');
            if (ca != cb) return ca < cb;
        }
        return false;
    });
    cout << answers.size() << '\n';
    for (const auto& board : answers)
        for (const string& row : board) cout << row << '\n';
    return 0;
}
