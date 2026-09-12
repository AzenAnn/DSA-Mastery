#include "../support/tree.hpp"

TreeNode* mergeTrees(const TreeNode* first, const TreeNode* second, Tree& output) {
    if (!first && !second) return nullptr;
    struct Work { const TreeNode* a; const TreeNode* b; TreeNode* out; };
    TreeNode* root = output.make((first ? first->val : 0) + (second ? second->val : 0));
    std::queue<Work> pending;
    pending.push({first, second, root});
    while (!pending.empty()) {
        const Work current = pending.front();
        pending.pop();
        for (int side = 0; side < 2; ++side) {
            const TreeNode* a = current.a ? (side ? current.a->right : current.a->left) : nullptr;
            const TreeNode* b = current.b ? (side ? current.b->right : current.b->left) : nullptr;
            if (!a && !b) continue;
            TreeNode* child = output.make((a ? a->val : 0) + (b ? b->val : 0));
            (side ? current.out->right : current.out->left) = child;
            pending.push({a, b, child});
        }
    }
    return root;
}
