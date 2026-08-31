#pragma once

#include <cstddef>
#include <memory>
#include <vector>

namespace avl {

// 自平衡二叉查找树（AVL 树）。实现本接口，使每次插入、删除后都保持：
//   - 中序遍历严格升序；
//   - 任意结点平衡因子（左子树高 - 右子树高）在 {-1, 0, 1} 内；
//   - 每个结点的高度等于左右子树较大高度加 1。
class AvlTree {
public:
    AvlTree();
    ~AvlTree();
    AvlTree(const AvlTree&) = delete;
    AvlTree& operator=(const AvlTree&) = delete;

    void insert(int key);              // 重复键忽略
    bool find(int key) const;          // 命中返回 true
    bool remove(int key);              // 删除成功返回 true，未找到返回 false
    int height() const;                // 空树为 0，否则最长根到叶路径上的结点数
    std::size_t size() const;          // 结点总数
    std::vector<int> inorder() const;  // 升序中序遍历
    bool verify() const;               // 全部不变量成立返回 true

private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
};

}  // namespace avl
