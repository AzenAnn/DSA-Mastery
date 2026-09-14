#include <algorithm>
#include <array>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<string> solve(const string& digits) {
    (void)digits;
    // TODO: choose one mapped letter per digit.
    return {};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string digits;
    if (!(cin >> digits)) return 0;
    auto answers = solve(digits);
    sort(answers.begin(), answers.end());
    cout << answers.size() << '\n';
    for (const string& answer : answers) cout << answer << '\n';
    return 0;
}
