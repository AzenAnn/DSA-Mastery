#include "tree.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, rootId = 0;
    std::cin >> n >> rootId;
    std::vector<BinaryNode> nodes(static_cast<std::size_t>(n) + 1);
    std::vector<GeneralNode> output(static_cast<std::size_t>(n) + 1);
    for (int id = 1; id <= n; ++id) nodes[id].id = output[id].id = id;
    for (int id = 1; id <= n; ++id) {
        int left = 0, right = 0;
        std::cin >> left >> right;
        nodes[id].left = left ? &nodes[left] : nullptr;
        nodes[id].right = right ? &nodes[right] : nullptr;
    }
    const auto roots = binaryToForest(rootId ? &nodes[rootId] : nullptr, output);
    std::cout << roots.size();
    for (const auto* node : roots) std::cout << ' ' << node->id;
    std::cout << '\n';
    for (int id = 1; id <= n; ++id) {
        std::cout << output[id].children.size();
        for (const auto* child : output[id].children) std::cout << ' ' << child->id;
        std::cout << '\n';
    }
}
