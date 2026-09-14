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

    // TODO: 读入层序序列构建二叉树，输出普通层序遍历及之字形层序遍历。
    // 要求：基于 BFS 队列分层收集，时间复杂度 O(n)，空间复杂度 O(n)。
    return 0;
}
