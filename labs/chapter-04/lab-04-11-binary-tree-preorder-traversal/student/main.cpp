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
        if (i < tokens.size() && tokens[i] != "null" && tokens[i] != "#") {
            curr->left = new TreeNode(std::stoi(tokens[i]));
            q.push(curr->left);
        }
        i++;
        if (i < tokens.size() && tokens[i] != "null" && tokens[i] != "#") {
            curr->right = new TreeNode(std::stoi(tokens[i]));
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

void freeTree(TreeNode* root) {
    if (!root) return;
    freeTree(root->left);
    freeTree(root->right);
    delete root;
}

// TODO: 请实现二叉树的前序遍历算法
std::vector<int> preorderTraversal(TreeNode* root) {
    std::vector<int> result;
    // 在此处编写你的前序遍历实现
    return result;
}

int main() {
    std::string line;
    if (!std::getline(std::cin, line) || line.empty()) {
        return 0;
    }
    std::stringstream ss(line);
    std::string token;
    std::vector<std::string> tokens;
    while (ss >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    std::vector<int> ans = preorderTraversal(root);
    for (size_t i = 0; i < ans.size(); ++i) {
        std::cout << ans[i] << (i + 1 == ans.size() ? "" : " ");
    }
    std::cout << "\n";
    freeTree(root);
    return 0;
}
