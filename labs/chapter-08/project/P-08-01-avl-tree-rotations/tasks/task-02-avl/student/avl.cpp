#include "avl.hpp"

#include <cstddef>
#include <memory>
#include <vector>

namespace avl {

struct AvlTree::Impl {
    // TODO: 用结点指针维护 AVL 树（key、left、right、height）。
};

AvlTree::AvlTree() : impl_(std::make_unique<Impl>()) {}
AvlTree::~AvlTree() = default;

void AvlTree::insert(int) {}
bool AvlTree::find(int) const { return false; }
bool AvlTree::remove(int) { return false; }
int AvlTree::height() const { return 0; }
std::size_t AvlTree::size() const { return 0; }
std::vector<int> AvlTree::inorder() const { return {}; }
bool AvlTree::verify() const { return true; }

}  // namespace avl
