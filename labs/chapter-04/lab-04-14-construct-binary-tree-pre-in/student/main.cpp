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

TreeNode* buildTree(const std::vector<int>& preorder, const std::vector<int>& inorder) {
    // TODO: 根据前序和中序序列恢复二叉树
    return nullptr;
}

void postorder(TreeNode* root, std::vector<int>& res) {
    if (!root) return;
    postorder(root->left, res);
    postorder(root->right, res);
    res.push_back(root->val);
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
    std::vector<int> preorder(n), inorder(n);
    for (int i = 0; i < n; i++) std::cin >> preorder[i];
    for (int i = 0; i < n; i++) std::cin >> inorder[i];

    TreeNode* root = buildTree(preorder, inorder);

    std::vector<int> post;
    postorder(root, post);
    std::cout << "POSTORDER:";
    for (int v : post) std::cout << " " << v;
    std::cout << "\n";

    std::vector<int> lvl = levelorder(root);
    std::cout << "LEVELORDER:";
    for (int v : lvl) std::cout << " " << v;
    std::cout << "\n";

    freeTree(root);
    return 0;
}
