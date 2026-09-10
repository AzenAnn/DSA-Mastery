#include <cstddef>
#include <iostream>
#include <vector>

void reverse(std::vector<long long>& a, std::size_t left, std::size_t right) {
    while (left < right) {
        std::swap(a[left], a[right - 1]);
        ++left;
        --right;
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0, k = 0;
    std::cin >> n >> k;
    if (n == 0) {
        std::cout << "\n";
        return 0;
    }

    std::vector<long long> a(n);
    for (auto& v : a) std::cin >> v;

    k %= n;
    reverse(a, 0, n);
    reverse(a, 0, k);
    reverse(a, k, n);

    for (std::size_t i = 0; i < n; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << a[i];
    }
    std::cout << '\n';
}
