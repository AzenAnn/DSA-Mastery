#include "tree.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, k = 0;
    std::cin >> n >> k;
    std::vector<GeneralNode> nodes(static_cast<std::size_t>(n) + 1);
    std::vector<BinaryNode> output(static_cast<std::size_t>(n) + 1);
    for (int id = 1; id <= n; ++id) nodes[id].id = output[id].id = id;
    std::vector<GeneralNode*> roots;
    for (int i = 0; i < k; ++i) {
        int id = 0; std::cin >> id; roots.push_back(&nodes[id]);
    }
    for (int id = 1; id <= n; ++id) {
        int degree = 0; std::cin >> degree;
        for (int j = 0; j < degree; ++j) {
            int child = 0; std::cin >> child; nodes[id].children.push_back(&nodes[child]);
        }
    }
    const BinaryNode* root = forestToBinary(roots, output);
    std::cout << (root ? root->id : 0) << '\n';
    for (int id = 1; id <= n; ++id) {
        std::cout << (output[id].left ? output[id].left->id : 0) << ' '
                  << (output[id].right ? output[id].right->id : 0) << '\n';
    }
}
