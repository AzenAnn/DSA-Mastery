#include <algorithm>
#include <array>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<std::array<int, 2>> intervals(n);
    for (auto& interval : intervals) std::cin >> interval[0] >> interval[1];

    std::sort(intervals.begin(), intervals.end(), [](const auto& left, const auto& right) {
        if (left[1] != right[1]) return left[1] < right[1];
        return left[0] < right[0];
    });

    int kept = 1;
    int lastEnd = intervals[0][1];
    for (int i = 1; i < n; ++i) {
        if (intervals[i][0] >= lastEnd) {
            ++kept;
            lastEnd = intervals[i][1];
        }
    }

    std::cout << n - kept << '\n';
    return 0;
}
