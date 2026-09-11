#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

vector<vector<int>> solve(vector<int> nums, int target) {
    (void)nums; (void)target;
    // TODO: use each position at most once and deduplicate combinations.
    return {};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> nums(n);
    for (int& value : nums) cin >> value;
    auto answers = solve(nums, target);
    sort(answers.begin(), answers.end());
    cout << answers.size() << '\n';
    for (const auto& row : answers) {
        cout << row.size();
        for (const auto& value : row) cout << ' ' << value;
        cout << '\n';
    }
    return 0;
}
