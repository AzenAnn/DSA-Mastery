#include <algorithm>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <vector>
using namespace std;

map<string, vector<long long>> memo;

vector<long long> solve(const string& expression) {
    auto found = memo.find(expression);
    if (found != memo.end()) return found->second;
    vector<long long> results;
    for (int i = 0; i < static_cast<int>(expression.size()); ++i) {
        char op = expression[i];
        if (op != '+' && op != '-' && op != '*') continue;
        vector<long long> left = solve(expression.substr(0, i));
        vector<long long> right = solve(expression.substr(i + 1));
        for (long long x : left) for (long long y : right) {
            if (op == '+') results.push_back(x + y);
            else if (op == '-') results.push_back(x - y);
            else results.push_back(x * y);
        }
    }
    if (results.empty()) results.push_back(stoll(expression));
    return memo[expression] = results;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string expression;
    if (!(cin >> expression)) return 0;
    vector<long long> raw = solve(expression);
    set<long long> unique(raw.begin(), raw.end());
    bool first = true;
    for (long long value : unique) { cout << (first ? "" : " ") << value; first = false; }
    cout << '\n';
}
