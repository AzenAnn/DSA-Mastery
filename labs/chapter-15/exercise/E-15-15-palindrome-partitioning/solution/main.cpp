#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<vector<string>> solve(const string& s) {
    int n = static_cast<int>(s.size());
    vector<vector<bool>> palindrome(n, vector<bool>(n, false));
    for (int left = n - 1; left >= 0; --left)
        for (int right = left; right < n; ++right)
            palindrome[left][right] = s[left] == s[right] &&
                (right - left < 2 || palindrome[left + 1][right - 1]);
    vector<vector<string>> answers;
    vector<string> path;
    function<void(int)> dfs = [&](int start) {
        if (start == n) {
            answers.push_back(path);
            return;
        }
        for (int end = start; end < n; ++end) {
            if (!palindrome[start][end]) continue;
            path.push_back(s.substr(start, end - start + 1));
            dfs(end + 1);
            path.pop_back();
        }
    };
    dfs(0);
    return answers;
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
