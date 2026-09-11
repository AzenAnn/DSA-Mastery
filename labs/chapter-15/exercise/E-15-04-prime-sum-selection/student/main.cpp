#include <algorithm>
#include <functional>
#include <iostream>
#include <numeric>
#include <vector>

using namespace std;

int solve(const vector<int>& nums, int k) {
    (void)nums;
    (void)k;
    // TODO: count prime-sum combinations of positions.
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    if (!(cin >> n >> k)) return 0;
    vector<int> nums(n);
    for (int& value : nums) cin >> value;
    cout << solve(nums, k) << '\n';
    return 0;
}
