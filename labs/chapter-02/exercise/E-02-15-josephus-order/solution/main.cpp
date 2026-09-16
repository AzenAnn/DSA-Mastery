#include <iostream>
#include <queue>

int main() {
    int n = 0, step = 0; if (!(std::cin >> n >> step)) return 0;
    std::queue<int> circle; for (int i = 1; i <= n; ++i) circle.push(i);
    bool first = true;
    while (!circle.empty()) {
        for (int i = 1; i < step; ++i) { circle.push(circle.front()); circle.pop(); }
        if (!first) std::cout << ' '; first = false;
        std::cout << circle.front(); circle.pop();
    }
    std::cout << '\n';
}
