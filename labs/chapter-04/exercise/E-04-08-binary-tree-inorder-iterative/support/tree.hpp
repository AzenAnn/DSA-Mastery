#pragma once
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <memory>
#include <queue>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

struct TreeNode {
    long long val;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
    explicit TreeNode(long long value) : val(value) {}
};

struct Tree {
    std::vector<std::unique_ptr<TreeNode>> storage;
    TreeNode* root = nullptr;
    TreeNode* make(long long value) {
        storage.push_back(std::make_unique<TreeNode>(value));
        return storage.back().get();
    }
};

inline Tree readTree(std::istream& input) {
    Tree tree;
    std::string line, token;
    std::getline(input, line);
    std::istringstream stream(line);
    if (!(stream >> token) || token == "null") return tree;
    tree.root = tree.make(std::stoll(token));
    std::queue<TreeNode*> pending;
    pending.push(tree.root);
    while (!pending.empty()) {
        TreeNode* node = pending.front();
        pending.pop();
        if (!(stream >> token)) break;
        if (token != "null") {
            node->left = tree.make(std::stoll(token));
            pending.push(node->left);
        }
        if (!(stream >> token)) break;
        if (token != "null") {
            node->right = tree.make(std::stoll(token));
            pending.push(node->right);
        }
    }
    return tree;
}

template <class T>
inline void printSequence(const std::vector<T>& values) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
}

inline void printTree(const TreeNode* root) {
    if (!root) { std::cout << "null\n"; return; }
    std::queue<const TreeNode*> pending;
    pending.push(root);
    std::vector<std::string> tokens;
    while (!pending.empty()) {
        const TreeNode* node = pending.front();
        pending.pop();
        if (!node) { tokens.push_back("null"); continue; }
        tokens.push_back(std::to_string(node->val));
        pending.push(node->left);
        pending.push(node->right);
    }
    while (!tokens.empty() && tokens.back() == "null") tokens.pop_back();
    printSequence(tokens);
}

std::vector<long long> inorderTraversal(const TreeNode* root);
