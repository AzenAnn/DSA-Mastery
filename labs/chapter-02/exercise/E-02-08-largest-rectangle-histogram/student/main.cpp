#include <cstddef>
#include <cstdint>
#include <iostream>
#include <vector>

std::int64_t largestRectangleArea(const std::vector<std::int64_t>& heights) {
    // TODO: 使用单调递增下标栈计算每根柱子作为最低高度时的最大宽度。
    static_cast<void>(heights);
    return 0;
}

int main() {
    std::size_t n = 0;
    std::cin >> n;

    std::vector<std::int64_t> heights(n);
    for (std::int64_t& height : heights) {
        std::cin >> height;
    }

    std::cout << largestRectangleArea(heights) << '\n';
}
