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

    // TODO: 读入两棵二叉树 root 和 subRoot，判断 subRoot 是否是 root 的子树。
    // 要求：递归匹配，时间复杂度 O(n * m)，空间复杂度 O(n + m)。
    return 0;
}
