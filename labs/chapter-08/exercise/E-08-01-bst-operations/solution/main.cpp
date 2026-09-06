#include <algorithm>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Node {
    int key;
    std::unique_ptr<Node> left;
    std::unique_ptr<Node> right;
    explicit Node(int k) : key(k) {}
};

class BST {
public:
    void insert(int key) { insert(root_, key); }
    bool find(int key) const { return find(root_.get(), key); }
    bool remove(int key) { return remove(root_, key); }

    void inorder() const {
        std::vector<int> values;
        collect(root_.get(), values);
        for (std::size_t i = 0; i < values.size(); ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << values[i];
        }
        std::cout << '\n';
    }

    int height() const { return height(root_.get()); }

private:
    std::unique_ptr<Node> root_;

    void insert(std::unique_ptr<Node>& node, int key) {
        if (!node) {
            node = std::make_unique<Node>(key);
            return;
        }
        if (key < node->key) insert(node->left, key);
        else if (key > node->key) insert(node->right, key);
    }

    bool find(const Node* node, int key) const {
        if (!node) return false;
        if (key == node->key) return true;
        return key < node->key ? find(node->left.get(), key) : find(node->right.get(), key);
    }

    bool remove(std::unique_ptr<Node>& node, int key) {
        if (!node) return false;
        if (key < node->key) return remove(node->left, key);
        if (key > node->key) return remove(node->right, key);

        if (!node->left) {
            node = std::move(node->right);
            return true;
        }
        if (!node->right) {
            node = std::move(node->left);
            return true;
        }

        const int successor = min(node->right.get());
        node->key = successor;
        return remove(node->right, successor);
    }

    int min(const Node* node) const {
        while (node->left) node = node->left.get();
        return node->key;
    }

    void collect(const Node* node, std::vector<int>& values) const {
        if (!node) return;
        collect(node->left.get(), values);
        values.push_back(node->key);
        collect(node->right.get(), values);
    }

    int height(const Node* node) const {
        if (!node) return 0;
        return 1 + std::max(height(node->left.get()), height(node->right.get()));
    }
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    BST bst;
    std::string op;
    while (std::cin >> op) {
        if (op == "insert") {
            int key;
            std::cin >> key;
            bst.insert(key);
        } else if (op == "find") {
            int key;
            std::cin >> key;
            std::cout << (bst.find(key) ? 1 : 0) << '\n';
        } else if (op == "remove") {
            int key;
            std::cin >> key;
            std::cout << (bst.remove(key) ? 1 : 0) << '\n';
        } else if (op == "inorder") {
            bst.inorder();
        } else if (op == "height") {
            std::cout << bst.height() << '\n';
        }
    }
    return 0;
}
