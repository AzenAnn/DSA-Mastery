#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;
    if (n == 0) {
        std::cout << "\n";
        return 0;
    }

    std::vector<long long> a(n);
    for (auto& v : a) std::cin >> v;

    std::size_t slow = 0;
    for (std::size_t fast = 1; fast < n; ++fast) {
        if (a[fast] != a[slow]) {
            a[++slow] = a[fast];
        }
    }

    for (std::size_t i = 0; i <= slow; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << a[i];
    }
    std::cout << '\n';
}
