// Lab 09-E-08 参考实现：散列集合 O(n) 求最长连续整数段。
// 关键剪枝：只对"没有前驱（v-1 不在集合中）"的值 v 作为段起点向右扩展，
// 每个值至多在扩展中被访问一次，总时间 O(n)。
// 对照：排序后线性扫描的 O(n log n) 解法同样能过，但散列解法避免全局有序。
#include <iostream>
#include <unordered_set>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::unordered_set<long long> values;
    values.reserve(static_cast<size_t>(n) * 2);
    for (int i = 0; i < n; ++i) {
        long long x = 0;
        std::cin >> x;
        values.insert(x);
    }

    long long best = 0;
    for (long long v : values) {
        if (values.count(v - 1) > 0) continue;  // 有前驱：不是段起点，跳过
        long long length = 1;
        while (values.count(v + length) > 0) ++length;
        if (length > best) best = length;
    }
    std::cout << best << '\n';
    return 0;
}
