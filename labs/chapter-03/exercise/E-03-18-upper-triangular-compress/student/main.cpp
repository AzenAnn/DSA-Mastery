#include <iostream>
#include <vector>

int main() {
    // TODO: 读入上三角压缩数组（含对角线、行优先、共 n(n+1)/2 个）与常量 c，再回答 q 组查询。
    //   1) i <= j 时，按下标公式 k = i(2n−i+1)/2 + (j−i) + 1（1-based）取出压缩数组第 k 项；
    //   2) i > j 时下三角区域没有存储，k 应当是 0，值应当输出常量 c；
    //   3) 每次查询必须是 O(1) 的直接寻址。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long n = 0;
    std::cin >> n;

    const long long total = n * (n + 1) / 2;
    std::vector<long long> packed(static_cast<std::size_t>(total) + 1, 0);
    for (long long k = 1; k <= total; ++k) {
        std::cin >> packed[static_cast<std::size_t>(k)];
    }

    long long constant = 0;
    std::cin >> constant;

    long long q = 0;
    std::cin >> q;
    for (long long t = 0; t < q; ++t) {
        long long i = 0;
        long long j = 0;
        std::cin >> i >> j;

        long long k = 0;
        long long value = 0;
        if (i <= j) {
            k = i * (2 * n - i + 1) / 2 + (j - i) + 1;
            value = packed[static_cast<std::size_t>(k)];
        } else {
            // TODO: 这里还不对 —— 下三角区域没有存储，但它的取值并不是 0，
            //   而是输入中给定的常量 c；k 也要保持为 0。
            k = 0;
            value = 0;
        }
        std::cout << k << ' ' << value << '\n';
    }
    return 0;
}
