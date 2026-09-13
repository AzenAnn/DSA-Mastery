// Lab 08-E-04 参考实现：排序 + 二分统计 A−B=C 的有序下标对个数。
// 对每个值 x（枚举 B），二分统计 x + c（即 A）的出现次数并累加。
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    long long c = 0;
    if (!(std::cin >> n >> c)) return 0;

    std::vector<long long> a(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> a[i];
    std::sort(a.begin(), a.end());

    long long pairs = 0;  // 答案可达 n^2 ≈ 4×10^10，必须用 long long
    for (int i = 0; i < n; ++i) {
        long long target = a[i] + c;  // x + c 可达 ±2×10^9，超出 int 范围
        auto lo = std::lower_bound(a.begin(), a.end(), target);
        auto hi = std::upper_bound(a.begin(), a.end(), target);
        pairs += static_cast<long long>(hi - lo);
    }
    std::cout << pairs << '\n';
    return 0;
}
