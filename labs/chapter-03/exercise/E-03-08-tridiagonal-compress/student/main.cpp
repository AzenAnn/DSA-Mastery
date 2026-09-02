#include <iostream>
#include <vector>

int main() {
    // TODO: 读入 n 阶三对角矩阵，按 k = 2i + j 压缩到一维数组，再回答查询 A[i][j]。
    // |i-j| > 1 的元素恒为 0；下标从 0 开始。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n;
    std::cin >> n;
    std::vector<std::vector<int>> a(n, std::vector<int>(n));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            std::cin >> a[i][j];
    int q;
    std::cin >> q;
    while (q--) {
        int i, j;
        std::cin >> i >> j;
        std::cout << 0 << '\n';
    }
    return 0;
}
