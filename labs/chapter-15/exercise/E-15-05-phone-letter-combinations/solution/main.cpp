#include <algorithm>
#include <array>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<string> solve(const string& digits) {
    const array<string, 10> letters = {"", "", "abc", "def", "ghi", "jkl",
                                      "mno", "pqrs", "tuv", "wxyz"};
    vector<string> answers;
    string path;
    function<void(int)> dfs = [&](int depth) {
        if (depth == static_cast<int>(digits.size())) {
            answers.push_back(path);
            return;
        }
        for (char ch : letters[digits[depth] - '0']) {
            path.push_back(ch);
            dfs(depth + 1);
            path.pop_back();
        }
    };
    dfs(0);
    return answers;
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
