#include "../support/tree.hpp"

long long sumOfLeftLeaves(const TreeNode* root) {
    if (!root) return 0;
    long long total = 0;
    std::vector<const TreeNode*> pending{root};
    while (!pending.empty()) {
        const TreeNode* node = pending.back();
        pending.pop_back();
        if (node->left) {
            if (!node->left->left && !node->left->right) total += node->left->val;
            else pending.push_back(node->left);
        }
        if (node->right) pending.push_back(node->right);
    }
    return total;
}
