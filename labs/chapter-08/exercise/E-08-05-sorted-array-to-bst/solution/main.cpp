// Lab 08-E-05 参考实现：左中点递归建平衡 BST + 队列层序输出。
// 口径：闭区间 [l, r] 取 mid = l + (r - l) / 2 为根，先左后右。
#include <iostream>
#include <queue>
#include <vector>

struct Node {
    long long val = 0;
    int left = -1;
    int right = -1;
};

std::vector<Node> tree;

// 返回子树根在 tree 中的下标；空区间返回 -1。
int build(const std::vector<long long>& a, int l, int r) {
    if (l > r) return -1;
    int mid = l + (r - l) / 2;
    int idx = static_cast<int>(tree.size());
    tree.push_back({a[static_cast<size_t>(mid)], -1, -1});
    tree[static_cast<size_t>(idx)].left = build(a, l, mid - 1);
    tree[static_cast<size_t>(idx)].right = build(a, mid + 1, r);
    return idx;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> a(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> a[i];

    int root = build(a, 0, n - 1);

    std::queue<int> bfs;
    if (root >= 0) bfs.push(root);
    bool first = true;
    while (!bfs.empty()) {
        int cur = bfs.front();
        bfs.pop();
        if (!first) std::cout << ' ';
        first = false;
        const Node& node = tree[static_cast<size_t>(cur)];
        std::cout << node.val;
        if (node.left >= 0) bfs.push(node.left);
        if (node.right >= 0) bfs.push(node.right);
    }
    std::cout << '\n';
    return 0;
}
