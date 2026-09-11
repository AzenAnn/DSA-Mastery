#include "tree.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    auto first = readTree(std::cin);
    auto second = readTree(std::cin);
    Tree output;
    output.root = mergeTrees(first.root, second.root, output);
    printTree(output.root);
}
