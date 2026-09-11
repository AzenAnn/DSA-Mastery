#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<vector<string>> solve(const string& s) {
    (void)s;
    // TODO: partition the string into nonempty palindromes.
    return {};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string s;
    if (!(cin >> s)) return 0;
    auto answers = solve(s);
    sort(answers.begin(), answers.end());
    cout << answers.size() << '\n';
    for (const auto& row : answers) {
        cout << row.size();
        for (const auto& value : row) cout << ' ' << value;
        cout << '\n';
    }
    return 0;
}
