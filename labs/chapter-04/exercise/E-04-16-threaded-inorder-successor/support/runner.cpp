#include "tree.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0, rootId = 0, q = 0;
    std::cin >> n >> rootId >> q;
    std::vector<ThreadNode> nodes(static_cast<std::size_t>(n) + 1);
    std::vector<std::array<int, 4>> original(static_cast<std::size_t>(n) + 1);
    for (int id = 1; id <= n; ++id) nodes[id].id = id;
    for (int id = 1; id <= n; ++id) {
        auto& row = original[id];
        std::cin >> row[0] >> row[1] >> row[2] >> row[3];
        nodes[id].left = row[0] ? &nodes[row[0]] : nullptr;
        nodes[id].ltag = row[1];
        nodes[id].right = row[2] ? &nodes[row[2]] : nullptr;
        nodes[id].rtag = row[3];
    }
    traverseInorderThreaded(rootId ? &nodes[rootId] : nullptr, std::cout);
    for (int i = 0; i < q; ++i) {
        int id = 0;
        std::cin >> id;
        std::cout << nodeId(inorderSuccessor(id ? &nodes[id] : nullptr)) << '\n';
    }
    for (int id = 1; id <= n; ++id) {
        const std::array<int, 4> actual{nodeId(nodes[id].left), nodes[id].ltag,
                                      nodeId(nodes[id].right), nodes[id].rtag};
        if (actual != original[id]) {
            std::cerr << "The threaded input tree was modified.\n";
            return 1;
        }
    }
}
