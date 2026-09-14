#include "../support/tree.hpp"

long long findTilt(const TreeNode* root) {
    if (!root) return 0;
    struct Frame {
        const TreeNode* node;
        int state;
        long long left;
        long long right;
    };
    std::vector<Frame> stack{{root, 0, 0, 0}};
    long long tilt = 0;
    while (!stack.empty()) {
        Frame& top = stack.back();
        if (top.state == 0) {
            top.state = 1;
            if (top.node->left) stack.push_back({top.node->left, 0, 0, 0});
        } else if (top.state == 1) {
            top.state = 2;
            if (top.node->right) stack.push_back({top.node->right, 0, 0, 0});
        } else {
            const long long sum = top.node->val + top.left + top.right;
            const long long difference = top.left - top.right;
            tilt += difference < 0 ? -difference : difference;
            stack.pop_back();
            if (!stack.empty()) {
                Frame& parent = stack.back();
                (parent.state == 1 ? parent.left : parent.right) = sum;
            }
        }
    }
    return tilt;
}
