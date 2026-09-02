#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>
#include <climits>

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

    // TODO: 读入层序序列构建二叉树，计算任意节点到任意节点路径的最大权值和（节点值可为负）。
    // 要求：后序遍历自底向上贡献最大单侧增益并更新全局最大路径和，时间复杂度 O(n)，空间复杂度 O(n)。
    return 0;
}
