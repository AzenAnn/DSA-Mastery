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

TreeNode* helper(const std::vector<int>& preorder, int preL, int preR,
                 const std::vector<int>& inorder, int inL, int inR,
                 const std::unordered_map<int, int>& inMap) {
    if (preL > preR || inL > inR) return nullptr;
    int rootVal = preorder[preL];
    TreeNode* root = new TreeNode(rootVal);
    int inRoot = inMap.at(rootVal);
    int leftSize = inRoot - inL;
    root->left = helper(preorder, preL + 1, preL + leftSize, inorder, inL, inRoot - 1, inMap);
    root->right = helper(preorder, preL + leftSize + 1, preR, inorder, inRoot + 1, inR, inMap);
    return root;
}

TreeNode* buildTree(const std::vector<int>& preorder, const std::vector<int>& inorder) {
    std::unordered_map<int, int> inMap;
    for (int i = 0; i < (int)inorder.size(); i++) {
        inMap[inorder[i]] = i;
    }
    return helper(preorder, 0, (int)preorder.size() - 1, inorder, 0, (int)inorder.size() - 1, inMap);
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
