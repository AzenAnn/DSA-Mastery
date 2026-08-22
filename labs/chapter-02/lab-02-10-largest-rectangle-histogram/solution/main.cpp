#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <vector>

std::int64_t largestRectangleArea(const std::vector<std::int64_t>& heights) {
    std::vector<std::size_t> increasing;
    increasing.reserve(heights.size());
    std::int64_t best = 0;

    for (std::size_t i = 0; i <= heights.size(); ++i) {
        const std::int64_t current = i == heights.size() ? -1 : heights[i];
        while (!increasing.empty() && heights[increasing.back()] >= current) {
            const std::int64_t height = heights[increasing.back()];
            increasing.pop_back();
            const std::size_t left = increasing.empty() ? 0 : increasing.back() + 1;
            const std::int64_t width = static_cast<std::int64_t>(i - left);
            best = std::max(best, height * width);
        }
        if (i < heights.size()) {
            increasing.push_back(i);
        }
    }

    return best;
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
