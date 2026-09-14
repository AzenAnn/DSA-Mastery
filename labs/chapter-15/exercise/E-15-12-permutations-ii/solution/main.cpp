#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

vector<vector<int>> solve(vector<int> nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> answers;
    vector<int> path;
    vector<bool> used(nums.size(), false);
    function<void()> dfs = [&]() {
        if (path.size() == nums.size()) {
            answers.push_back(path);
            return;
        }
        for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;
            used[i] = true;
            path.push_back(nums[i]);
            dfs();
            path.pop_back();
            used[i] = false;
        }
    };
    dfs();
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
