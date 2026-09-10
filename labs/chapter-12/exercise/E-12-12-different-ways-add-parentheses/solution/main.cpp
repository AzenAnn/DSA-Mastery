#include <bits/stdc++.h>
using namespace std;

string expression;
map<pair<int, int>, vector<long long>> memo;

vector<long long> solve(int left, int right) {
    pair<int, int> key{left, right};
    if (memo.count(key)) return memo[key];
    vector<long long> results;
    for (int i = left; i < right; ++i) {
        char op = expression[i];
        if (op != '+' && op != '-' && op != '*') continue;
        vector<long long> a = solve(left, i);
        vector<long long> b = solve(i + 1, right);
        for (long long x : a) for (long long y : b) {
            if (op == '+') results.push_back(x + y);
            else if (op == '-') results.push_back(x - y);
            else results.push_back(x * y);
        }
    }
    if (results.empty()) results.push_back(stoll(expression.substr(left, right - left)));
    return memo[key] = results;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> expression;
    vector<long long> results = solve(0, expression.size());
    sort(results.begin(), results.end());
    for (int i = 0; i < static_cast<int>(results.size()); ++i) cout << results[i] << (i + 1 == static_cast<int>(results.size()) ? '\n' : ' ');
    return 0;
}
