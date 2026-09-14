#include "../support/tree.hpp"

std::vector<GeneralNode*> binaryToForest(const BinaryNode* root, std::vector<GeneralNode>& output) {
    std::vector<GeneralNode*> roots;
    for (const BinaryNode* node = root; node; node = node->right) roots.push_back(&output[node->id]);
    if (!root) return roots;
    std::vector<const BinaryNode*> pending{root};
    while (!pending.empty()) {
        const BinaryNode* node = pending.back();
        pending.pop_back();
        for (const BinaryNode* child = node->left; child; child = child->right) {
            output[node->id].children.push_back(&output[child->id]);
        }
        if (node->right) pending.push_back(node->right);
        if (node->left) pending.push_back(node->left);
    }
    return roots;
}
