#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    char type = 'U', format = 'E';
    int n = 0;
    if (!(std::cin >> type >> format >> n)) return 0;
    std::vector<std::vector<int>> matrix(n, std::vector<int>(n));
    std::vector<std::vector<int>> lists(n);
    std::vector<std::pair<int, int>> edges;
    if (format == 'E') {
        int m = 0;
        std::cin >> m;
        for (int i = 0; i < m; ++i) {
            int u = 0, v = 0;
            std::cin >> u >> v;
            edges.emplace_back(u, v);
        }
    } else if (format == 'M') {
        for (auto& row : matrix) for (int& value : row) std::cin >> value;
    } else {
        for (auto& neighbors : lists) {
            int k = 0;
            std::cin >> k;
            neighbors.resize(k);
            for (int& v : neighbors) std::cin >> v;
        }
    }
    // TODO: Convert the supplied representation into all three forms.
    // TODO: Print MATRIX, LIST, and EDGES with the required ordering.
    // TODO: Output each undirected logical edge only once, with u < v.
}
