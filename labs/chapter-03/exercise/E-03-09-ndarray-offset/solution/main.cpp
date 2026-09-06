#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n;
    std::cin >> n;
    std::vector<long long> b(n), idx(n);
    for (auto& x : b) std::cin >> x;
    for (auto& x : idx) std::cin >> x;

    // 行优先偏移：offset = Σ_{k} j_k * Π_{s=k+1..n-1} b_s
    long long offset = 0;
    for (int k = 0; k < n; ++k) {
        long long stride = 1;
        for (int s = k + 1; s < n; ++s) stride *= b[s];
        offset += idx[k] * stride;
    }
    std::cout << offset << '\n';
    return 0;
}
