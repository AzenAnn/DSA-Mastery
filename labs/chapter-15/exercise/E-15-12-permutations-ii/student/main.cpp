#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>

using namespace std;

vector<vector<int>> solve(vector<int> nums) {
    (void)nums;
    // TODO: return all distinct full permutations.
    return {};
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
