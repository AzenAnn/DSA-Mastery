#include <cstddef>
#include <iostream>
#include <queue>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    if (!(std::cin >> n)) return 0;

    std::queue<long long> requests;
    for (std::size_t i = 0; i < n; ++i) {
        long long time = 0;
        std::cin >> time;
        requests.push(time);
        while (!requests.empty() && requests.front() < time - 3000) requests.pop();
        if (i > 0) std::cout << ' ';
        std::cout << requests.size();
    }
    std::cout << '\n';
}
