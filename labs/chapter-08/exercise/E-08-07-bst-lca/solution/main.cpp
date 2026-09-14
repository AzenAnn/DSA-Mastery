// Lab 08-E-07 参考实现：利用 BST 性质从根向下找最近公共祖先。
// 设两目标关键字的小者为 a、大者为 b：都在左侧走左，都在右侧走右，
// 否则（分叉或当前值等于其一）当前结点即 LCA。
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0, q = 0;
    if (!(std::cin >> n >> q)) return 0;

    std::vector<long long> val(static_cast<size_t>(n));
    std::vector<int> left(static_cast<size_t>(n), -1), right(static_cast<size_t>(n), -1);
    for (int i = 0; i < n; ++i) {
        int id = 0, l = -1, r = -1;
        std::cin >> id >> val[id] >> l >> r;
        left[id] = l;
        right[id] = r;
    }

    while (q-- > 0) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        long long a = val[u], b = val[v];
        if (a > b) {
            long long tmp = a;
            a = b;
            b = tmp;
        }

        int cur = 0;
        while (true) {
            if (b < val[cur]) {
                cur = left[cur];   // 两个目标都在左子树
            } else if (a > val[cur]) {
                cur = right[cur];  // 两个目标都在右子树
            } else {
                break;             // 分叉点，或 a/b 中有一个等于当前值（祖先-后代）
            }
        }
        std::cout << val[cur] << '\n';
    }
    return 0;
}
