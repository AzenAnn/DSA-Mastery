// Lab 08-E-06 参考实现：自根向下传递开区间 (low, high) 校验 BST。
// 教材口径：关键字互不相同，左子树严格小、右子树严格大；空树是 BST。
#include <climits>
#include <iostream>
#include <vector>

struct Node {
    long long val = 0;
    int left = -1;
    int right = -1;
};

std::vector<Node> nodes;

// 不变量：当前子树所有关键字必须严格落在 (low, high) 内。
// 哨兵用 long long 的极限值，而不是题目边界 ±10^18：
// 结点关键字本身可以恰好等于 -10^18 或 10^18。
bool check(int idx, long long low, long long high) {
    if (idx < 0) return true;
    const Node& node = nodes[static_cast<size_t>(idx)];
    if (node.val <= low || node.val >= high) return false;
    return check(node.left, low, node.val) && check(node.right, node.val, high);
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    nodes.resize(static_cast<size_t>(n));

    for (int k = 0; k < n; ++k) {
        int i = 0, l = 0, r = 0;
        long long val = 0;
        std::cin >> i >> val >> l >> r;
        nodes[static_cast<size_t>(i)] = {val, l, r};
    }

    bool ok = true;
    if (n > 0) ok = check(0, LLONG_MIN, LLONG_MAX);
    std::cout << (ok ? 1 : 0) << '\n';
    return 0;
}
