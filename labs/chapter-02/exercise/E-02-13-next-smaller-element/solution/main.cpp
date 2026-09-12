#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::size_t n = 0; if (!(std::cin >> n)) return 0;
    std::vector<long long> a(n), answer(n, -1); std::vector<std::size_t> pending;
    for (auto& x : a) std::cin >> x;
    for (std::size_t i = 0; i < n; ++i) {
        while (!pending.empty() && a[pending.back()] > a[i]) { answer[pending.back()] = a[i]; pending.pop_back(); }
        pending.push_back(i);
    }
    for (std::size_t i = 0; i < n; ++i) std::cout << (i ? " " : "") << answer[i];
    std::cout << '\n';
}
