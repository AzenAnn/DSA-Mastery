#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n;
    std::cin >> n;
    std::vector<std::vector<int>> a(n, std::vector<int>(n));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            std::cin >> a[i][j];

    // 压缩：只存 |i-j| <= 1 的元素，下标 k = 2i + j。
    std::vector<int> b(3 * n - 2, 0);
    for (int i = 0; i < n; ++i) {
        for (int j = std::max(0, i - 1); j <= std::min(n - 1, i + 1); ++j) {
            b[2 * i + j] = a[i][j];
        }
    }

    int q;
    std::cin >> q;
    while (q--) {
        int i, j;
        std::cin >> i >> j;
        if (std::abs(i - j) <= 1)
            std::cout << b[2 * i + j] << '\n';
        else
            std::cout << 0 << '\n';
    }
    return 0;
}
