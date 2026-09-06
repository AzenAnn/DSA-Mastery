#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> pushed(n);
    std::vector<long long> popped(n);
    for (auto& value : pushed) std::cin >> value;
    for (auto& value : popped) std::cin >> value;

    std::vector<long long> stack;
    stack.reserve(n);
    std::size_t next = 0;
    for (const long long value : pushed) {
        stack.push_back(value);
        while (!stack.empty() && next < n && stack.back() == popped[next]) {
            stack.pop_back();
            ++next;
        }
    }

    if (next == n) {
        std::cout << "YES\n";
    } else {
        std::cout << "NO " << next << '\n';
    }
}
