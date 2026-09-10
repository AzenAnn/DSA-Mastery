#include "avl.hpp"

#include <algorithm>
#include <cstddef>
#include <memory>
#include <vector>

namespace avl {
namespace {

struct Node {
    int key;
    Node* left = nullptr;
    Node* right = nullptr;
    int height = 1;
    explicit Node(int k) : key(k) {}
};

int node_height(const Node* node) { return node ? node->height : 0; }
int node_balance(const Node* node) { return node ? node_height(node->left) - node_height(node->right) : 0; }

void update(Node* node) {
    node->height = 1 + std::max(node_height(node->left), node_height(node->right));
}

Node* rotate_right(Node* y) {
    Node* x = y->left;
    Node* t2 = x->right;
    x->right = y;
    y->left = t2;
    update(y);
    update(x);
    return x;
}

Node* rotate_left(Node* x) {
    Node* y = x->right;
    Node* t2 = y->left;
    y->left = x;
    x->right = t2;
    update(x);
    update(y);
    return y;
}

Node* insert_node(Node* node, int key, bool& inserted) {
    if (!node) {
        inserted = true;
        return new Node(key);
    }
    if (key < node->key) {
        node->left = insert_node(node->left, key, inserted);
    } else if (key > node->key) {
        node->right = insert_node(node->right, key, inserted);
    } else {
        return node;
    }

    update(node);
    const int b = node_balance(node);
    if (b > 1 && key < node->left->key) return rotate_right(node);                                               // LL
    if (b < -1 && key > node->right->key) return rotate_left(node);                                              // RR
    if (b > 1 && key > node->left->key) { node->left = rotate_left(node->left); return rotate_right(node); }     // LR
    if (b < -1 && key < node->right->key) { node->right = rotate_right(node->right); return rotate_left(node); } // RL
    return node;
}

Node* min_node(Node* node) {
    while (node->left) node = node->left;
    return node;
}

Node* remove_node(Node* node, int key, bool& removed) {
    if (!node) return nullptr;
    if (key < node->key) {
        node->left = remove_node(node->left, key, removed);
    } else if (key > node->key) {
        node->right = remove_node(node->right, key, removed);
    } else {
        removed = true;
        if (!node->left || !node->right) {
            Node* child = node->left ? node->left : node->right;
            delete node;
            return child;
        }
        Node* successor = min_node(node->right);
        node->key = successor->key;
        node->right = remove_node(node->right, successor->key, removed);
    }

    update(node);
    const int b = node_balance(node);
    if (b > 1 && node_balance(node->left) >= 0) return rotate_right(node);                                              // LL
    if (b > 1 && node_balance(node->left) < 0) { node->left = rotate_left(node->left); return rotate_right(node); }     // LR
    if (b < -1 && node_balance(node->right) <= 0) return rotate_left(node);                                            // RR
    if (b < -1 && node_balance(node->right) > 0) { node->right = rotate_right(node->right); return rotate_left(node); } // RL
    return node;
}

void collect_inorder(const Node* node, std::vector<int>& out) {
    if (!node) return;
    collect_inorder(node->left, out);
    out.push_back(node->key);
    collect_inorder(node->right, out);
}

bool check_node(const Node* node, int* previous, bool* has_previous, std::size_t* count) {
    if (!node) return true;
    if (!check_node(node->left, previous, has_previous, count)) return false;
    if (*has_previous && *previous >= node->key) return false;
    *previous = node->key;
    *has_previous = true;
    ++*count;
    if (!check_node(node->right, previous, has_previous, count)) return false;
    if (node->height != 1 + std::max(node_height(node->left), node_height(node->right))) return false;
    if (node_balance(node) < -1 || node_balance(node) > 1) return false;
    return true;
}

void destroy(Node* node) {
    if (!node) return;
    destroy(node->left);
    destroy(node->right);
    delete node;
}

}  // namespace

struct AvlTree::Impl {
    Node* root = nullptr;
    std::size_t count = 0;
    ~Impl() { destroy(root); }
};

AvlTree::AvlTree() : impl_(std::make_unique<Impl>()) {}
AvlTree::~AvlTree() = default;

void AvlTree::insert(int key) {
    bool inserted = false;
    impl_->root = insert_node(impl_->root, key, inserted);
    if (inserted) ++impl_->count;
}

bool AvlTree::find(int key) const {
    Node* node = impl_->root;
    while (node) {
        if (key == node->key) return true;
        node = key < node->key ? node->left : node->right;
    }
    return false;
}

bool AvlTree::remove(int key) {
    bool removed = false;
    impl_->root = remove_node(impl_->root, key, removed);
    if (removed) --impl_->count;
    return removed;
}

int AvlTree::height() const { return impl_->root ? impl_->root->height : 0; }

std::size_t AvlTree::size() const { return impl_->count; }

std::vector<int> AvlTree::inorder() const {
    std::vector<int> out;
    collect_inorder(impl_->root, out);
    return out;
}

bool AvlTree::verify() const {
    int previous = 0;
    bool has_previous = false;
    std::size_t count = 0;
    if (!check_node(impl_->root, &previous, &has_previous, &count)) return false;
    return count == impl_->count;
}

}  // namespace avl
