#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<string> solve(int n) {
    vector<string> answers;
    string path;
    function<void(int, int)> dfs = [&](int left, int right) {
        if (right == n) {
            answers.push_back(path);
            return;
        }
        if (left < n) {
            path.push_back('(');
            dfs(left + 1, right);
            path.pop_back();
        }
        if (right < left) {
            path.push_back(')');
            dfs(left, right + 1);
            path.pop_back();
        }
    };
    dfs(0, 0);
    return answers;
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
