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

    // TODO(1): 对每次查询读入结点编号 u、v，取出对应关键字 a、b。
    // TODO(2): 从根（编号 0）出发，利用 BST 性质找 LCA：
    //          - 两个关键字都小于当前结点 -> 走左孩子；
    //          - 两个关键字都大于当前结点 -> 走右孩子；
    //          - 否则（分叉，或当前值等于其中之一）当前结点即答案。
    //          注意 u 可以等于 v，u 也可能是 v 的祖先（或反之）。
    // TODO(3): 输出 LCA 的关键字（val），每行一个。
    long long queries = q;
    while (queries-- > 0) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        (void)u;
        (void)v;
        (void)left;
        (void)right;
        std::cout << 0 << '\n';
    }
    return 0;
}
