#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> height(n);
    for (long long& value : height) std::cin >> value;

    int left = 0;
    int right = n - 1;
    long long answer = 0;

    while (left < right) {
        const long long width = right - left;
        const long long boundedHeight = std::min(height[left], height[right]);
        answer = std::max(answer, width * boundedHeight);

        if (height[left] < height[right]) {
            ++left;
        } else {
            --right;
        }
    }

    std::cout << answer << '\n';
    return 0;
}
