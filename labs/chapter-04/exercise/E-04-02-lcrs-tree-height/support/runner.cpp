#include "tree.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    auto tree = readTree();
    std::cout << treeHeight(tree.root) << '\n';
}
