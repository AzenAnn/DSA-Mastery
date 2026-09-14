#pragma once
#include <iostream>
#include <queue>
#include <vector>

struct Node {
    int id = 0;
    Node* firstChild = nullptr;
    Node* nextSibling = nullptr;
};

struct Tree {
    std::vector<Node> nodes;
    Node* root = nullptr;
};

inline Tree readTree() {
    int n = 0, rootId = 0;
    std::cin >> n >> rootId;
    Tree tree;
    tree.nodes.resize(static_cast<std::size_t>(n) + 1);
    for (int id = 1; id <= n; ++id) tree.nodes[id].id = id;
    for (int id = 1; id <= n; ++id) {
        int first = 0, next = 0;
        std::cin >> first >> next;
        tree.nodes[id].firstChild = first ? &tree.nodes[first] : nullptr;
        tree.nodes[id].nextSibling = next ? &tree.nodes[next] : nullptr;
    }
    tree.root = rootId ? &tree.nodes[rootId] : nullptr;
    return tree;
}

inline void printSequence(const std::vector<int>& values) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
}

int treeHeight(const Node* root);
