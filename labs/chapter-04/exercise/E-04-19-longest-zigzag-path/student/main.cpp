#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
    TreeNode(int x) : val(x) {}
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    getline(cin, line);

    // TODO: 解析层序遍历序列，构建二叉树
    // null 表示空节点

    // TODO: 树形 DP（后序遍历）
    // 对每个节点 u 维护：
    //   leftZig[u] = 1 + rightZig[u->left]   （第一步向左）
    //   rightZig[u] = 1 + leftZig[u->right]  （第一步向右）
    // 空节点返回 (-1, -1)，叶子节点返回 (0, 0)

    // TODO: 维护全局最大值 ans

    // TODO: 输出 ans

    return 0;
}
