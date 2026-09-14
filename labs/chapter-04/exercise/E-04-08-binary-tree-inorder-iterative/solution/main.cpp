#include "../support/tree.hpp"

std::vector<long long> inorderTraversal(const TreeNode* root) {
    std::vector<long long> result;
    std::vector<const TreeNode*> stack;
    const TreeNode* current = root;
    while (current || !stack.empty()) {
        while (current) {
            stack.push_back(current);
            current = current->left;
        }
        current = stack.back();
        stack.pop_back();
        result.push_back(current->val);
        current = current->right;
    }
    return result;
}
