#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>

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

    // TODO: 读入层序序列构建二叉树，计算二叉树中任意两节点间最长路径的长度（直径）。
    // 要求：后序遍历自底向上计算左右子树最大深度并更新最大直径，时间复杂度 O(n)，空间复杂度 O(n)。
    return 0;
}
