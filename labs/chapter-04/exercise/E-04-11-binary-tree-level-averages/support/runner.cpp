#include "tree.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    auto tree = readTree(std::cin);
    std::cout << std::fixed << std::setprecision(10);
    printSequence(averageOfLevels(tree.root));
}
