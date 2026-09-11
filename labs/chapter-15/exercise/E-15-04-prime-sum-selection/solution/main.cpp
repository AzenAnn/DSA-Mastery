#include <algorithm>
#include <functional>
#include <iostream>
#include <numeric>
#include <vector>

using namespace std;

int solve(const vector<int>& nums, int k) {
    int maximum = accumulate(nums.begin(), nums.end(), 0);
    int limit = 0;
    while ((limit + 1) * (limit + 1) <= maximum) ++limit;
    vector<bool> composite(limit + 1, false);
    vector<int> primes;
    for (int p = 2; p <= limit; ++p) {
        if (composite[p]) continue;
        primes.push_back(p);
        for (int multiple = p * p; multiple <= limit; multiple += p)
            composite[multiple] = true;
    }
    auto isPrime = [&](int value) {
        if (value < 2) return false;
        for (int p : primes) {
            if (p * p > value) break;
            if (value % p == 0) return false;
        }
        return true;
    };
    int answer = 0;
    function<void(int, int, int)> dfs = [&](int start, int left, int sum) {
        if (left == 0) {
            if (isPrime(sum)) ++answer;
            return;
        }
        for (int i = start; i <= static_cast<int>(nums.size()) - left; ++i)
            dfs(i + 1, left - 1, sum + nums[i]);
    };
    dfs(0, k, 0);
    return answer;
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
