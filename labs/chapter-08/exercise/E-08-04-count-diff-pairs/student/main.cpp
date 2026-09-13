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

    // TODO(1): 把 a_i - a_j = c 改写成 A = B + c：先排序，再对每个值 x
    //          二分统计 x + c 的出现次数（upper_bound 减 lower_bound）。
    // 注意：x + c 可达 ±2e9，目标值与答案累计都必须用 long long。
    // TODO(2): c = 0 且全相同时答案为 n^2 ≈ 4e10，int 会静默溢出。
    long long pairs = 0;
    (void)a;
    std::cout << pairs << '\n';
    return 0;
}
