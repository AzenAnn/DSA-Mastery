#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <stack>

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
        if (i < tokens.size() && tokens[i] != "null") {
            curr->left = new TreeNode(std::stoi(tokens[i]));
            q.push(curr->left);
        }
        i++;
        if (i < tokens.size() && tokens[i] != "null") {
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

std::vector<int> preorderTraversal(TreeNode* root) {
    std::vector<int> res;
    if (root == nullptr) return res;
    std::stack<TreeNode*> st;
    st.push(root);
    while (!st.empty()) {
        TreeNode* node = st.top();
        st.pop();
        res.push_back(node->val);
        if (node->right != nullptr) st.push(node->right);
        if (node->left != nullptr)  st.push(node->left);
    }
    return res;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
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
