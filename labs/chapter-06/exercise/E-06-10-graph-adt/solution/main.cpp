#include <iostream>
#include <set>
#include <string>
#include <vector>

class Graph {
    bool directed;
    std::vector<std::set<int>> neighbors;
public:
    Graph(int n, bool isDirected) : directed(isDirected), neighbors(n) {}
    bool add(int u, int v) {
        bool inserted = neighbors[u].insert(v).second;
        if (!directed) neighbors[v].insert(u);
        return inserted;
    }
    bool remove(int u, int v) {
        bool removed = neighbors[u].erase(v) != 0;
        if (!directed) neighbors[v].erase(u);
        return removed;
    }
    bool has(int u, int v) const { return neighbors[u].count(v) != 0; }
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
