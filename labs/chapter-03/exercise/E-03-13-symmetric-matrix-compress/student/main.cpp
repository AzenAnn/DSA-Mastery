#include <iostream>
#include <vector>

int main() {
    // TODO: 本题要求把 n 阶对称矩阵的下三角（含主对角线）按行优先压进一维数组，
    //   再回答 q 次取值查询。请补全下面三件事：
    //   1) 读入 n，再读入 n(n+1)/2 个压缩数组元素（下三角、行优先、空格分隔且可跨多行）；
    //   2) 对每次查询 i j（0-based），先比较 i 与 j：
    //        - i >= j 时，k = i(i+1)/2 + j + 1；
    //        - i <  j 时，按对称性 A[i][j] = A[j][i]，k = j(j+1)/2 + i + 1；
    //   3) 输出 k 与 A[i][j]，每次查询一行，两个整数用空格分隔。
    //   注意：压缩数组下标 k 是 1-based，查询下标 i、j 是 0-based；
    //   本题 n 最大 1000（压缩数组 500500 个整数），请保留快速读入写法。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long n = 0;
    std::cin >> n;

    const long long total = n * (n + 1) / 2;
    // packed[k] 保存压缩数组第 k 个元素（1-based），便于直接用下标公式取值。
    std::vector<long long> packed(static_cast<std::size_t>(total) + 1, 0);
    for (long long k = 1; k <= total; ++k) {
        std::cin >> packed[static_cast<std::size_t>(k)];
    }

    long long q = 0;
    std::cin >> q;
    for (long long t = 0; t < q; ++t) {
        long long i = 0;
        long long j = 0;
        std::cin >> i >> j;

        // TODO: 用上面的公式算出 k，再输出 k 与 packed[k]。
        //   目前统一输出 0 0，只是为了让骨架能编译，无法通过测试点。
        std::cout << 0 << ' ' << 0 << '\n';
    }
    return 0;
}
