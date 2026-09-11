#include "../support/tree.hpp"

const ThreadNode* inorderSuccessor(const ThreadNode* node) {
    if (!node) return nullptr;
    if (node->rtag == 1) return node->right;
    node = node->right;
    while (node && node->ltag == 0) node = node->left;
    return node;
}

void traverseInorderThreaded(const ThreadNode* root, std::ostream& output) {
    const ThreadNode* node = root;
    while (node && node->ltag == 0) node = node->left;
    bool first = true;
    while (node) {
        if (!first) output << ' ';
        output << node->id;
        first = false;
        node = inorderSuccessor(node);
    }
    output << '\n';
}
