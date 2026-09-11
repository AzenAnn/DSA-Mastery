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

    // 学生需要在这里完成按结束时间排序的区间贪心。
    std::cout << 0 << '\n';
    return 0;
}
