#include "../support/tree.hpp"

std::vector<double> averageOfLevels(const TreeNode* root) {
    std::vector<double> result;
    if (!root) return result;
    std::queue<const TreeNode*> pending;
    pending.push(root);
    while (!pending.empty()) {
        const std::size_t count = pending.size();
        long long sum = 0;
        for (std::size_t i = 0; i < count; ++i) {
            const TreeNode* node = pending.front();
            pending.pop();
            sum += node->val;
            if (node->left) pending.push(node->left);
            if (node->right) pending.push(node->right);
        }
        result.push_back(static_cast<double>(sum) / static_cast<double>(count));
    }
    return result;
}
