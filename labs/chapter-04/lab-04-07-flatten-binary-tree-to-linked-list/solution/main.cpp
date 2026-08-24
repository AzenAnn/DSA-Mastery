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
    while (root) {
        TreeNode* next = root->right;
        delete root;
        root = next;
    }
}

void flatten(TreeNode* root) {
    TreeNode* curr = root;
    while (curr != nullptr) {
        if (curr->left != nullptr) {
            TreeNode* next = curr->left;
            TreeNode* predecessor = next;
            while (predecessor->right != nullptr) {
                predecessor = predecessor->right;
            }
            predecessor->right = curr->right;
            curr->left = nullptr;
            curr->right = next;
        }
        curr = curr->right;
    }
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    flatten(root);
    if (!root) {
        std::cout << "<empty>\n";
    } else {
        bool first = true;
        TreeNode* cur = root;
        while (cur) {
            if (!first) std::cout << " ";
            std::cout << cur->val;
            first = false;
            cur = cur->right;
        }
        std::cout << "\n";
    }
    freeTree(root);
    return 0;
}
