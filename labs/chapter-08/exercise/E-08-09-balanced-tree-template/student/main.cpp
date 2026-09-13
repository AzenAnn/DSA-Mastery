#include <iostream>
#include <vector>

// TODO：把下面的骨架补成手写 AVL 树（带子树大小 size）。
// 提示：不能用 std::map / std::multiset 直接糊——压力用例包含升序插入，
// 普通 BST 会退化成链导致超时，必须自己维护平衡。
struct Node {
    long long key = 0;
    int left = 0;    // 用 0 号位置当空哨兵，left/right 为 0 表示空
    int right = 0;
    int height = 0;  // 空结点高度 0，叶结点高度 1
    int size = 0;    // 子树元素个数（含重复），排名与第 k 小都要靠它
};

static std::vector<Node> t;
static int root = 0;

// TODO(1) 基础工具：pull(x) 用左右孩子更新 height 与 size；
//          rotateLeft / rotateRight，旋转后先 pull 被转下去的结点再 pull 新根。

// TODO(2) rebalance(x)：插入/删除回溯时调用。
//          计算 bf = h(left) - h(right)：
//          bf > 1 且左孩子的 bf < 0 -> LR（先左旋拉直再右旋）；否则 LL（右旋）；
//          bf < -1 且右孩子的 bf > 0 -> RL（先右旋拉直再左旋）；否则 RR（左旋）。

// TODO(3) insertNode / eraseNode（multiset 语义：相等关键字进右子树；
//          删除只删一个，两个孩子时用中序后继的键替换后从右子树删后继），
//          回溯路径上逐层 rebalance 并维护 size。

// TODO(4) 查询：
//          rankOf(x)：严格小于 x 的元素个数 + 1，沿树下行累加左子树 size；
//          kth(k)：用左子树 size 判断往左走还是往右走；
//          prevKey / nextKey：严格小于 / 严格大于的最邻近元素（保证存在）。

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    t.assign(1, Node{});  // t[0] 空哨兵
    int n = 0;
    if (!(std::cin >> n)) return 0;

    // 下面的 0 只是未实现时的占位输出，实现 TODO 后替换为真实查询结果。
    for (int i = 0; i < n; ++i) {
        int opt = 0;
        long long x = 0;
        std::cin >> opt >> x;
        (void)opt;
        (void)x;
        if (opt >= 3) std::cout << 0 << '\n';
    }
    return 0;
}
