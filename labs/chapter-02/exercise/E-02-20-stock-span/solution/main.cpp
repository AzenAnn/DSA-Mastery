#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::size_t n = 0; if (!(std::cin >> n)) return 0;
    std::vector<long long> price(n); std::vector<std::size_t> stack;
    for (auto& x : price) std::cin >> x;
    for (std::size_t i = 0; i < n; ++i) {
        while (!stack.empty() && price[stack.back()] <= price[i]) stack.pop_back();
        const std::size_t span = stack.empty() ? i + 1 : i - stack.back();
        if (i) std::cout << ' '; std::cout << span; stack.push_back(i);
    }
    std::cout << '\n';
}
