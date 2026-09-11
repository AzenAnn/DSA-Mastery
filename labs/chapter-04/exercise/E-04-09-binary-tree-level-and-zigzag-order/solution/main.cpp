#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>

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

void printLevelAndZigzag(TreeNode* root) {
    if (!root) {
        std::cout << "LEVEL_ORDER:\nZIGZAG_ORDER:\n";
        return;
    }

    std::vector<std::vector<int>> levelOrder;
    std::vector<std::deque<int>> zigzagOrder;

    std::queue<TreeNode*> q;
    q.push(root);
    bool leftToRight = true;

    while (!q.empty()) {
        size_t sz = q.size();
        std::vector<int> curLevel;
        std::deque<int> curZigzag;

        for (size_t i = 0; i < sz; i++) {
            TreeNode* node = q.front();
            q.pop();

            curLevel.push_back(node->val);

            // 解法一（双端队列法）：偶数层尾插，奇数层头插，无需 std::reverse
            if (leftToRight) {
                curZigzag.push_back(node->val);
            } else {
                curZigzag.push_front(node->val);
            }

            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }

        levelOrder.push_back(curLevel);
        zigzagOrder.push_back(curZigzag);
        leftToRight = !leftToRight;
    }

    std::cout << "LEVEL_ORDER:\n";
    for (const auto& lv : levelOrder) {
        for (size_t i = 0; i < lv.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << lv[i];
        }
        std::cout << "\n";
    }

    std::cout << "ZIGZAG_ORDER:\n";
    for (const auto& row : zigzagOrder) {
        for (size_t i = 0; i < row.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << row[i];
        }
        std::cout << "\n";
    }
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    printLevelAndZigzag(root);
    freeTree(root);
    return 0;
}
