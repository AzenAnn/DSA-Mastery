#include <cstddef>
#include <iostream>
#include <stack>

int main() {
    std::size_t n = 0; if (!(std::cin >> n)) return 0;
    std::stack<long long> source, helper;
    for (std::size_t i = 0; i < n; ++i) { long long x = 0; std::cin >> x; source.push(x); }
    while (!source.empty()) {
        const long long current = source.top(); source.pop();
        while (!helper.empty() && helper.top() > current) { source.push(helper.top()); helper.pop(); }
        helper.push(current);
    }
    // Move the sorted stack back to the input stack so its top is the smallest value.
    while (!helper.empty()) { source.push(helper.top()); helper.pop(); }
    for (std::size_t i = 0; i < n; ++i) {
        if (i) std::cout << ' ';
        std::cout << source.top();
        source.pop();
    }
    std::cout << '\n';
}
