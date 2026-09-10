#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<int> nums(n);
    for (int& value : nums) std::cin >> value;

    long long maxReach = 0;
    for (int i = 0; i < n; ++i) {
        if (i > maxReach) {
            std::cout << "false\n";
            return 0;
        }
        maxReach = std::max(maxReach, static_cast<long long>(i) + nums[i]);
        if (maxReach >= n - 1) {
            std::cout << "true\n";
            return 0;
        }
    }

    std::cout << "true\n";
    return 0;
}
