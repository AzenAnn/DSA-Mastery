#include <cstddef>
#include <iostream>
#include <queue>
#include <stack>

int main() {
    std::size_t n = 0, k = 0; if (!(std::cin >> n >> k)) return 0;
    std::queue<long long> queue; for (std::size_t i = 0; i < n; ++i) { long long x = 0; std::cin >> x; queue.push(x); }
    std::stack<long long> stack; for (std::size_t i = 0; i < k; ++i) { stack.push(queue.front()); queue.pop(); }
    while (!stack.empty()) { queue.push(stack.top()); stack.pop(); }
    for (std::size_t i = k; i < n; ++i) { queue.push(queue.front()); queue.pop(); }
    for (std::size_t i = 0; i < n; ++i) { if (i) std::cout << ' '; std::cout << queue.front(); queue.pop(); }
    std::cout << '\n';
}
