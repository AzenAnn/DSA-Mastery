#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

TreeNode* buildTree(const std::vector<std::string>& tokens) {
    if (tokens.empty() || tokens[0] == "null" || tokens[0] == "#") return nullptr;
    TreeNode* root = new TreeNode(std::stoi(tokens[0]));
    std::queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < tokens.size()) {
        TreeNode* curr = q.front();
        q.pop();
        if (i < tokens.size()) {
            if (tokens[i] != "null" && tokens[i] != "#") {
                curr->left = new TreeNode(std::stoi(tokens[i]));
                q.push(curr->left);
            }
            i++;
        }
        if (i < tokens.size()) {
            if (tokens[i] != "null" && tokens[i] != "#") {
                curr->right = new TreeNode(std::stoi(tokens[i]));
                q.push(curr->right);
            }
            i++;
        }
    }
    return root;
}

void freeTree(TreeNode* root) {
    if (!root) return;
    freeTree(root->left);
    freeTree(root->right);
    delete root;
}

TreeNode* lowestCommonAncestor(TreeNode* root, int p, int q) {
    // TODO: 求解二叉树中值为 p 和 q 的最近公共祖先节点
    return nullptr;
}

int main() {
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    int p, q;
    if (!(std::cin >> p >> q)) return 0;

    std::vector<std::string> tokens;
    std::string token;
    std::stringstream ss(line);
    while (ss >> token) tokens.push_back(token);

    TreeNode* root = buildTree(tokens);
    TreeNode* lca = lowestCommonAncestor(root, p, q);

    if (lca) {
        std::cout << lca->val << "\n";
    }

    freeTree(root);
    return 0;
}
