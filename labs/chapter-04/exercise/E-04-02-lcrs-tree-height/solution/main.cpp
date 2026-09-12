#include "../support/tree.hpp"

int treeHeight(const Node* root) {
    if (!root) return -1;
    int height = -1;
    std::queue<const Node*> pending;
    pending.push(root);
    while (!pending.empty()) {
        const std::size_t count = pending.size();
        ++height;
        for (std::size_t i = 0; i < count; ++i) {
            const Node* node = pending.front();
            pending.pop();
            for (const Node* child = node->firstChild; child; child = child->nextSibling) {
                pending.push(child);
            }
        }
    }
    return height;
}
