#include "../support/tree.hpp"

static const TreeNode* nextLeaf(std::vector<const TreeNode*>& stack) {
    while (!stack.empty()) {
        const TreeNode* node = stack.back();
        stack.pop_back();
        if (!node->left && !node->right) return node;
        if (node->right) stack.push_back(node->right);
        if (node->left) stack.push_back(node->left);
    }
    return nullptr;
}

bool leafSimilar(const TreeNode* first, const TreeNode* second) {
    std::vector<const TreeNode*> left, right;
    if (first) left.push_back(first);
    if (second) right.push_back(second);
    while (true) {
        const TreeNode* a = nextLeaf(left);
        const TreeNode* b = nextLeaf(right);
        if (!a || !b) return a == nullptr && b == nullptr;
        if (a->val != b->val) return false;
    }
}
