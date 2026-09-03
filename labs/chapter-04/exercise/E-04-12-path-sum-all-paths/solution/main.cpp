#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <sstream>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

TreeNode* buildTree(const std::vector<std::string>& tokens) {
    if (tokens.empty() || tokens[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(std::stoi(tokens[0]));
    std::queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < tokens.size()) {
        TreeNode* curr = q.front();
        q.pop();
        if (i < tokens.size()) {
            if (tokens[i] != "null") {
                curr->left = new TreeNode(std::stoi(tokens[i]));
                q.push(curr->left);
            }
            i++;
        }
        if (i < tokens.size()) {
            if (tokens[i] != "null") {
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

void dfs(TreeNode* root, int targetSum, std::vector<int>& curPath, std::vector<std::vector<int>>& res) {
    if (!root) return;
    curPath.push_back(root->val);
    targetSum -= root->val;
    if (!root->left && !root->right) {
        if (targetSum == 0) {
            res.push_back(curPath);
        }
    } else {
        dfs(root->left, targetSum, curPath, res);
        dfs(root->right, targetSum, curPath, res);
    }
    curPath.pop_back();
}

std::vector<std::vector<int>> pathSum(TreeNode* root, int targetSum) {
    std::vector<std::vector<int>> res;
    std::vector<int> curPath;
    dfs(root, targetSum, curPath, res);
    return res;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
        if (std::cin.peek() == '\n' || std::cin.peek() == '\r') break;
    }
    int targetSum = 0;
    if (!(std::cin >> targetSum)) return 0;

    TreeNode* root = buildTree(tokens);
    auto paths = pathSum(root, targetSum);

    if (paths.empty()) {
        std::cout << "NONE\n";
    } else {
        for (const auto& p : paths) {
            for (size_t i = 0; i < p.size(); i++) {
                std::cout << (i == 0 ? "" : " ") << p[i];
            }
            std::cout << "\n";
        }
    }

    freeTree(root);
    return 0;
}
