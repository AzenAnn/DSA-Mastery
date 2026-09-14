#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> a(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> a[i];

    // TODO(1): 递归处理闭区间 [l, r]，取左中点 mid = l + (r - l) / 2 为根，
    //          先递归构造左子树，再递归构造右子树；用数组下标保存结点。
    // TODO(2): 用队列做层序遍历输出；n = 0 时输出一个空行。
    // 注意：直接输出原数组不是平衡 BST 的层序遍历（仅 n = 1 时恰好相同）。
    for (int i = 0; i < n; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << a[i];
    }
    std::cout << '\n';
    return 0;
}
