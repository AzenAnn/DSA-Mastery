// Lab 08-E-08 参考实现：一次后序遍历自底向上判定 AVL 平衡条件。
// 函数返回子树高度；发现失衡时返回 -1 并短路向上传递，整体 O(n)。
#include <iostream>
#include <vector>

static std::vector<long long> val;
static std::vector<int> leftChild, rightChild;

// 返回以 id 为根的子树高度；子树内任一结点失衡时返回 -1。
static int heightOrUnbalanced(int id) {
    if (id == -1) return 0;
    int lh = heightOrUnbalanced(leftChild[id]);
    if (lh < 0) return -1;              // 左子树已失衡，短路
    int rh = heightOrUnbalanced(rightChild[id]);
    if (rh < 0) return -1;              // 右子树已失衡，短路
    if (lh - rh > 1 || rh - lh > 1) return -1;
    return (lh > rh ? lh : rh) + 1;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    val.assign(static_cast<size_t>(n), 0);
    leftChild.assign(static_cast<size_t>(n), -1);
    rightChild.assign(static_cast<size_t>(n), -1);
    for (int i = 0; i < n; ++i) {
        int id = 0, l = -1, r = -1;
        std::cin >> id >> val[id] >> l >> r;
        leftChild[id] = l;
        rightChild[id] = r;
    }

    // 空树（n = 0）视为平衡；非空时从根（编号 0）开始判定。
    bool balanced = (n == 0) || (heightOrUnbalanced(0) >= 0);
    std::cout << (balanced ? 1 : 0) << '\n';
    return 0;
}
