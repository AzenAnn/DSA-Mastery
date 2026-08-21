#include "avl.hpp"

#include <iostream>
#include <string>
#include <vector>

namespace {

bool is_sorted(const std::vector<int>& values) {
    for (std::size_t i = 1; i < values.size(); ++i) {
        if (values[i - 1] >= values[i]) return false;
    }
    return true;
}

int insert_rotations() {
    // 四组三键插入分别触发 LL / RR / LR / RL；若不旋转，树会退化成高度 3 的链。
    const int cases[4][3] = {
        {3, 2, 1},  // LL
        {1, 2, 3},  // RR
        {3, 1, 2},  // LR
        {1, 3, 2},  // RL
    };
    for (const auto& keys : cases) {
        avl::AvlTree tree;
        for (int key : keys) {
            tree.insert(key);
            if (!tree.verify()) {
                std::cerr << "insert broke an invariant\n";
                return 1;
            }
        }
        if (tree.height() != 2) {
            std::cerr << "rotation failed: expected height 2, got " << tree.height() << "\n";
            return 1;
        }
        if (!is_sorted(tree.inorder())) {
            std::cerr << "inorder is not strictly ascending\n";
            return 1;
        }
    }

    // 混合序列，含重复键，多次旋转后仍须保持全部不变量。
    avl::AvlTree tree;
    const int mixed[] = {30, 20, 40, 10, 25, 35, 50, 5, 15, 28, 30, 40};
    for (int key : mixed) {
        tree.insert(key);
        if (!tree.verify()) {
            std::cerr << "mixed insert " << key << " broke an invariant\n";
            return 1;
        }
    }
    if (tree.size() != 10) {
        std::cerr << "unexpected size " << tree.size() << "\n";
        return 1;
    }
    return 0;
}

int delete_rebalance() {
    avl::AvlTree tree;
    for (int key = 1; key <= 15; ++key) tree.insert(key);
    if (!tree.verify()) return 1;

    // 删除一系列内部结点，触发双孩子替换与多级回溯。
    const int removed[] = {8, 4, 12, 2, 14, 6, 10};
    for (int key : removed) {
        if (!tree.remove(key)) {
            std::cerr << "remove " << key << " failed\n";
            return 1;
        }
        if (!tree.verify()) {
            std::cerr << "remove " << key << " broke an invariant\n";
            return 1;
        }
    }
    if (tree.remove(8)) return 1;  // 已删除，再次删除应失败
    const std::vector<int> inorder = tree.inorder();
    if (!is_sorted(inorder)) return 1;
    return inorder.size() == 8 ? 0 : 1;
}

int balanced_height() {
    avl::AvlTree tree;
    for (int key = 1; key <= 1000; ++key) tree.insert(key);
    if (!tree.verify()) {
        std::cerr << "ordered insert broke an invariant\n";
        return 1;
    }
    // 1000 个有序键的 AVL 树高应为 floor(log2(1000)) + 1 = 10，远低于普通 BST 的 1000。
    const int h = tree.height();
    if (h > 11) {
        std::cerr << "ordered 1000 keys produced unexpected height " << h << "\n";
        return 1;
    }
    return tree.find(1) && tree.find(1000) && !tree.find(1001) ? 0 : 1;
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 2) return 2;
    const std::string test = argv[1];
    if (test == "insert-rotations") return insert_rotations();
    if (test == "delete-rebalance") return delete_rebalance();
    if (test == "balanced-height") return balanced_height();
    std::cerr << "unknown test\n";
    return 2;
}
