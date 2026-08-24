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

bool isSameTree(TreeNode* s, TreeNode* t) {
    if (!s && !t) return true;
    if (!s || !t) return false;
    return (s->val == t->val) && isSameTree(s->left, t->left) && isSameTree(s->right, t->right);
}

bool isSubtree(TreeNode* root, TreeNode* subRoot) {
    if (!root) return false;
    if (isSameTree(root, subRoot)) return true;
    return isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
}

int main() {
    std::string line1, line2;
    if (!std::getline(std::cin, line1) || !std::getline(std::cin, line2)) return 0;
    std::vector<std::string> tokens1, tokens2;
    std::string token;
    std::stringstream ss1(line1), ss2(line2);
    while (ss1 >> token) tokens1.push_back(token);
    while (ss2 >> token) tokens2.push_back(token);

    TreeNode* root = buildTree(tokens1);
    TreeNode* subRoot = buildTree(tokens2);

    std::cout << (isSubtree(root, subRoot) ? "true" : "false") << "\n";

    freeTree(root);
    freeTree(subRoot);
    return 0;
}
