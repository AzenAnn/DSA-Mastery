#include "../support/tree.hpp"

std::vector<int> postorder(const Node* root) {
    std::vector<int> result;
    if (!root) return result;
    struct Frame { const Node* node; const Node* nextChild; };
    std::vector<Frame> stack{{root, root->firstChild}};
    while (!stack.empty()) {
        if (stack.back().nextChild) {
            const Node* child = stack.back().nextChild;
            stack.back().nextChild = child->nextSibling;
            stack.push_back({child, child->firstChild});
        } else {
            result.push_back(stack.back().node->id);
            stack.pop_back();
        }
    }
    return result;
}
