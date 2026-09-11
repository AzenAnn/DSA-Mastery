#include "../support/tree.hpp"

int countLeaves(const Node* root) {
    if (!root) return 0;
    int leaves = 0;
    std::vector<const Node*> pending{root};
    while (!pending.empty()) {
        const Node* node = pending.back();
        pending.pop_back();
        if (!node->firstChild) ++leaves;
        for (const Node* child = node->firstChild; child; child = child->nextSibling) {
            pending.push_back(child);
        }
    }
    return leaves;
}
