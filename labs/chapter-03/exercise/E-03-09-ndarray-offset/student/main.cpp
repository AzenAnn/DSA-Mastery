#include <iostream>
#include <vector>

int main() {
    // TODO: 读入 n 维数组的各维长度 b[0..n-1] 与下标 idx[0..n-1]，
    // 计算行优先的一维偏移量 offset = Σ_{k} idx[k] * Π_{s=k+1..n-1} b[s]。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n;
    std::cin >> n;
    std::vector<long long> b(n), idx(n);
    for (auto& x : b) std::cin >> x;
    for (auto& x : idx) std::cin >> x;
    std::cout << 0 << '\n';
    return 0;
}
