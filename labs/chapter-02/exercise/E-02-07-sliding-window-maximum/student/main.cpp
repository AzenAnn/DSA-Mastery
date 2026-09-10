#include <cstddef>
#include <cstdint>
#include <iostream>
#include <vector>

std::vector<std::int64_t> slidingWindowMaximum(
    const std::vector<std::int64_t>& values,
    std::size_t windowSize) {
    // TODO: 使用双端队列维护仍在窗口内的最大值候选下标。
    return std::vector<std::int64_t>(values.size() - windowSize + 1, 0);
}

int main() {
    std::size_t n = 0;
    std::size_t windowSize = 0;
    std::cin >> n >> windowSize;

    std::vector<std::int64_t> values(n);
    for (std::int64_t& value : values) {
        std::cin >> value;
    }

    const std::vector<std::int64_t> answers = slidingWindowMaximum(values, windowSize);
    for (std::size_t i = 0; i < answers.size(); ++i) {
        if (i != 0) {
            std::cout << ' ';
        }
        std::cout << answers[i];
    }
    std::cout << '\n';
}
