#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

vector<vector<int>> solve(vector<int> nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> answers;
    vector<int> path;
    function<void(int)> dfs = [&](int start) {
        answers.push_back(path);
        for (int i = start; i < static_cast<int>(nums.size()); ++i) {
            if (i > start && nums[i] == nums[i - 1]) continue;
            path.push_back(nums[i]);
            dfs(i + 1);
            path.pop_back();
        }
    };
    dfs(0);
    return answers;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int& value : nums) cin >> value;
    auto answers = solve(nums);
    sort(answers.begin(), answers.end());
    cout << answers.size() << '\n';
    for (const auto& row : answers) {
        cout << row.size();
        for (int value : row) cout << ' ' << value;
        cout << '\n';
    }
    return 0;
}
