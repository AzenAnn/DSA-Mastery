#include "../support/tree.hpp"

BinaryNode* forestToBinary(const std::vector<GeneralNode*>& roots, std::vector<BinaryNode>& output) {
    if (roots.empty()) return nullptr;
    std::vector<const GeneralNode*> pending(roots.begin(), roots.end());
    while (!pending.empty()) {
        const GeneralNode* node = pending.back();
        pending.pop_back();
        if (!node->children.empty()) output[node->id].left = &output[node->children[0]->id];
        for (std::size_t i = 0; i < node->children.size(); ++i) {
            const GeneralNode* child = node->children[i];
            output[child->id].right = i + 1 < node->children.size()
                ? &output[node->children[i + 1]->id] : nullptr;
            pending.push_back(child);
        }
    }
    for (std::size_t i = 0; i < roots.size(); ++i) {
        output[roots[i]->id].right = i + 1 < roots.size() ? &output[roots[i + 1]->id] : nullptr;
    }
    return &output[roots[0]->id];
}
