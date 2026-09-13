#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> val(static_cast<size_t>(n));
    std::vector<int> left(static_cast<size_t>(n), -1), right(static_cast<size_t>(n), -1);
    for (int i = 0; i < n; ++i) {
        int id = 0, l = -1, r = -1;
        std::cin >> id >> val[id] >> l >> r;
        left[id] = l;
        right[id] = r;
    }

    // TODO(1): 实现后序自底向上求高度：空子树返回 0，
    //          左右高度差超过 1（或子树已失衡）时用 -1 短路向上传递。
    // TODO(2): 整棵树平衡输出 1，任一结点失衡输出 0；空树（n = 0）输出 1。
    //          注意：树不一定是 BST，只看形态；叶子深度差不能代替逐结点高度差。
    // 下面的 -1 只是未实现时的占位输出（协议取值只有 0 和 1），请替换。
    (void)val;
    (void)left;
    (void)right;
    std::cout << -1 << '\n';
    return 0;
}
