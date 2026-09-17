#include <iostream>
#include <vector>

// 参考解：行优先与列优先偏移都能达到 20^10 级别，地址最大约 8.3e13，
// 必须全程使用 64 位整数（int 会溢出）。
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    std::cin >> n;

    std::vector<long long> dims(n);
    for (int k = 0; k < n; ++k) std::cin >> dims[k];

    long long wordSize = 0;
    long long base = 0;
    std::cin >> wordSize >> base;

    int q = 0;
    std::cin >> q;

    std::vector<long long> idx(n);
    while (q-- > 0) {
        for (int k = 0; k < n; ++k) std::cin >> idx[k];

        // 行优先：第 k 维的 stride 是 b[k+1..n-1] 的连乘（最后一维为 1）。
        long long rowOffset = 0;
        for (int k = 0; k < n; ++k) {
            long long stride = 1;
            for (int s = k + 1; s < n; ++s) stride *= dims[s];
            rowOffset += idx[k] * stride;
        }

        // 列优先：第 k 维的 stride 是 b[0..k-1] 的连乘（第一维为 1）。
        long long colOffset = 0;
        for (int k = 0; k < n; ++k) {
            long long stride = 1;
            for (int s = 0; s < k; ++s) stride *= dims[s];
            colOffset += idx[k] * stride;
        }

        std::cout << rowOffset << ' ' << base + rowOffset * wordSize << ' '
                  << colOffset << ' ' << base + colOffset * wordSize << '\n';
    }
    return 0;
}
