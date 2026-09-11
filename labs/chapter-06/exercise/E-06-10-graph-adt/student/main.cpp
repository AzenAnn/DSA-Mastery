#include <iostream>
#include <set>
#include <string>
#include <vector>

class Graph {
    bool directed;
    std::vector<std::set<int>> neighbors;
public:
    Graph(int n, bool isDirected) : directed(isDirected), neighbors(n) {}
    bool add(int, int) {
        // TODO: Insert once and maintain both directions for an undirected edge.
        return false;
    }
    bool remove(int, int) {
        // TODO: Remove the edge if present and report whether anything changed.
        return false;
    }
    bool has(int, int) const {
        // TODO: Query the current graph without mutating it.
        return false;
    }
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    char type = 'U';
    int n = 0, q = 0;
    if (!(std::cin >> type >> n >> q)) return 0;
    Graph graph(n, type == 'D');
    for (int i = 0; i < q; ++i) {
        std::string operation;
        int u = 0, v = 0;
        std::cin >> operation >> u >> v;
        bool result = operation == "ADD" ? graph.add(u, v)
                    : operation == "DEL" ? graph.remove(u, v) : graph.has(u, v);
        std::cout << result << '\n';
    }
}
