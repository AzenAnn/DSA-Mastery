#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

vector<vector<int>> solve(vector<int> nums, int target) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> answers;
    vector<int> path;
    function<void(int, int)> dfs = [&](int start, int remaining) {
        if (remaining == 0) {
            answers.push_back(path);
            return;
        }
        for (int i = start; i < static_cast<int>(nums.size()); ++i) {
            if (nums[i] > remaining) break;
            if (i > start && nums[i] == nums[i - 1]) continue;
            path.push_back(nums[i]);
            dfs(i + 1, remaining - nums[i]);
            path.pop_back();
        }
    };
    dfs(0, target);
    return answers;
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
