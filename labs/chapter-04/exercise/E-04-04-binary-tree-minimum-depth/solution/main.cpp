#include "../support/tree.hpp"

int minDepth(const TreeNode* root) {
    if (!root) return 0;
    std::queue<std::pair<const TreeNode*, int>> pending;
    pending.push({root, 1});
    while (!pending.empty()) {
        const auto [node, depth] = pending.front();
        pending.pop();
        if (!node->left && !node->right) return depth;
        if (node->left) pending.push({node->left, depth + 1});
        if (node->right) pending.push({node->right, depth + 1});
    }
    return 0;
}
