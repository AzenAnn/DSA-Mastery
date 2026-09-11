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

    // TODO: 读入层序序列构建二叉树，输出从右侧所能看到的节点值序列。
    // 要求：基于 BFS 每层最右节点或 DFS 根右左，时间复杂度 O(n)，空间复杂度 O(n)。
    return 0;
}
