#include "tree.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, rootId = 0;
    std::cin >> n >> rootId;
    std::vector<ThreadNode> nodes(static_cast<std::size_t>(n) + 1);
    for (int id = 1; id <= n; ++id) nodes[id].id = id;
    for (int id = 1; id <= n; ++id) {
        int left = 0, right = 0;
        std::cin >> left >> right;
        nodes[id].left = left ? &nodes[left] : nullptr;
        nodes[id].right = right ? &nodes[right] : nullptr;
    }
    createInorderThread(rootId ? &nodes[rootId] : nullptr);
    std::cout << n << ' ' << rootId << '\n';
    for (int id = 1; id <= n; ++id) {
        const auto& node = nodes[id];
        std::cout << nodeId(node.left) << ' ' << node.ltag << ' '
                  << nodeId(node.right) << ' ' << node.rtag << '\n';
    }
}
