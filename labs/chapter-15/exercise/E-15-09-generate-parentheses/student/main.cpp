#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<string> solve(int n) {
    (void)n;
    // TODO: generate all valid parenthesis strings.
    return {};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    auto answers = solve(n);
    sort(answers.begin(), answers.end());
    cout << answers.size() << '\n';
    for (const auto& answer : answers) cout << answer << '\n';
    return 0;
}
