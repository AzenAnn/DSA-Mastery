#include <cstddef>
#include <cstdint>
#include <deque>
#include <iostream>
#include <vector>

std::vector<std::int64_t> slidingWindowMaximum(
    const std::vector<std::int64_t>& values,
    std::size_t windowSize) {
    std::deque<std::size_t> candidates;
    std::vector<std::int64_t> answers;
    answers.reserve(values.size() - windowSize + 1);

    for (std::size_t i = 0; i < values.size(); ++i) {
        while (!candidates.empty() && candidates.front() + windowSize <= i) {
            candidates.pop_front();
        }
        while (!candidates.empty() && values[candidates.back()] <= values[i]) {
            candidates.pop_back();
        }
        candidates.push_back(i);

        if (i + 1 >= windowSize) {
            answers.push_back(values[candidates.front()]);
        }
    }

    return answers;
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
