#include "tree.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    auto first = readTree(std::cin);
    auto second = readTree(std::cin);
    std::cout << (leafSimilar(first.root, second.root) ? "true" : "false") << '\n';
}
