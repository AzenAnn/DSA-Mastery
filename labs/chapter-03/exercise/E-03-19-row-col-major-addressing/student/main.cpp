#include <iostream>

// TODO: 本题的偏移量最大可达 20^10 ≈ 1.02×10^13，地址最大约 8.3×10^13，
//       int 一定溢出，必须改用 long long 保存 dims、偏移与地址。
// TODO: 行优先偏移 = Σ idx[k] × (b[k+1] × … × b[n-1])，最后一维的 stride 是 1。
// TODO: 列优先偏移 = Σ idx[k] × (b[0] × … × b[k-1])，第一维的 stride 是 1
//       —— 目前下面直接输出 0，请补齐这一半。
// TODO: 地址 = base + 偏移 × w，同样要用 64 位整数；base 最大 10^12。
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    std::cin >> n;

    long long dims[10] = {0};
    for (int k = 0; k < n; ++k) std::cin >> dims[k];

    long long wordSize = 0;
    long long base = 0;
    std::cin >> wordSize >> base;

    int q = 0;
    std::cin >> q;

    for (int query = 0; query < q; ++query) {
        long long idx[10] = {0};
        for (int k = 0; k < n; ++k) std::cin >> idx[k];

        // 行优先：stride 用 int 连乘，规模一大就会溢出成负数或乱值。
        int rowOffset = 0;
        for (int k = 0; k < n; ++k) {
            int stride = 1;
            for (int s = k + 1; s < n; ++s) stride *= static_cast<int>(dims[s]);
            rowOffset += static_cast<int>(idx[k]) * stride;
        }

        std::cout << rowOffset << ' ' << base + 1LL * rowOffset * wordSize << ' '
                  << 0 << ' ' << base << '\n';
    }
    return 0;
}
