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

TreeNode* buildTree(const std::vector<int>& inorder, const std::vector<int>& postorder) {
    // TODO: 根据中序和后序序列恢复二叉树
    return nullptr;
}

void preorder(TreeNode* root, std::vector<int>& res) {
    if (!root) return;
    res.push_back(root->val);
    preorder(root->left, res);
    preorder(root->right, res);
}

std::vector<int> levelorder(TreeNode* root) {
    std::vector<int> res;
    if (!root) return res;
    std::queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* cur = q.front();
        q.pop();
        res.push_back(cur->val);
        if (cur->left) q.push(cur->left);
        if (cur->right) q.push(cur->right);
    }
    return res;
}

void freeTree(TreeNode* root) {
    if (!root) return;
    freeTree(root->left);
    freeTree(root->right);
    delete root;
}

int main() {
    int n;
    if (!(std::cin >> n) || n <= 0) return 0;
    std::vector<int> inorder(n), postorder(n);
    for (int i = 0; i < n; i++) std::cin >> inorder[i];
    for (int i = 0; i < n; i++) std::cin >> postorder[i];

    TreeNode* root = buildTree(inorder, postorder);

    std::vector<int> pre;
    preorder(root, pre);
    std::cout << "PREORDER:";
    for (int v : pre) std::cout << " " << v;
    std::cout << "\n";

    std::vector<int> lvl = levelorder(root);
    std::cout << "LEVELORDER:";
    for (int v : lvl) std::cout << " " << v;
    std::cout << "\n";

    freeTree(root);
    return 0;
}
