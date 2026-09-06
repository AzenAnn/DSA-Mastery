#include <iostream>
#include <vector>
#include <unordered_map>
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

    // TODO: 读入前序与中序遍历序列，重构二叉树并输出其后序遍历序列与层序遍历序列。
    // 要求：递归分治或哈希加速定位根节点，时间复杂度 O(n)，空间复杂度 O(n)。
    return 0;
}
