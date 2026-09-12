#include <iostream>
#include <vector>
#include <string>
#include <queue>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    // TODO: 读入层序序列与节点值 p, q，寻找 p 和 q 在二叉树中的最近公共祖先 (LCA)。
    // 要求：递归分治后序遍历查找，时间复杂度 O(n)，空间复杂度 O(n)。
    return 0;
}
