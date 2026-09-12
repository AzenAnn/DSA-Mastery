#include "../support/tree.hpp"

const ThreadNode* inorderSuccessor(const ThreadNode*) {
    // TODO: distinguish a successor thread from a real right subtree.
    return nullptr;
}

void traverseInorderThreaded(const ThreadNode*, std::ostream& output) {
    // TODO: stream the inorder sequence without recursion or a stack.
    output << '\n';
}
