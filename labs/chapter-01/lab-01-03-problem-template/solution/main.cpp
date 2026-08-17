#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;
    std::vector<long long> first(n);
    for (auto& value : first) std::cin >> value;

    std::size_t m = 0;
    std::cin >> m;
    std::vector<long long> second(m);
    for (auto& value : second) std::cin >> value;

    std::size_t i = 0;
    std::size_t j = 0;
    bool needs_space = false;
    while (i < first.size() || j < second.size()) {
        const bool take_first = j == second.size() || (i < first.size() && first[i] <= second[j]);
        const long long value = take_first ? first[i++] : second[j++];
        if (needs_space) std::cout << ' ';
        std::cout << value;
        needs_space = true;
    }
    std::cout << '\n';
}
