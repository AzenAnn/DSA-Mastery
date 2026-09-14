#include "../support/tree.hpp"

void createInorderThread(ThreadNode* root) {
    std::vector<ThreadNode*> stack;
    ThreadNode* current = root;
    ThreadNode* previous = nullptr;
    while (current || !stack.empty()) {
        while (current) {
            stack.push_back(current);
            current = current->left;
        }
        current = stack.back();
        stack.pop_back();
        if (!current->left) {
            current->left = previous;
            current->ltag = 1;
        }
        if (previous && !previous->right) {
            previous->right = current;
            previous->rtag = 1;
        }
        previous = current;
        current = current->right;
    }
    if (previous) {
        previous->right = nullptr;
        previous->rtag = 1;
    }
}
