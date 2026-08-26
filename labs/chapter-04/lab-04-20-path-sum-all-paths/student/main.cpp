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

    // TODO: 读入层序序列与目标和 targetSum，找出所有根节点到叶节点路径和等于目标值的路径。
    // 要求：回溯法记录路径并输出，时间复杂度 O(n)，空间复杂度 O(n)。
    return 0;
}
