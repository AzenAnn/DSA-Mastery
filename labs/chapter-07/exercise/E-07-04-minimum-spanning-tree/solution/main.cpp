#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

struct Edge {
    int u;
    int v;
    long long w;
};

struct DSU {
    std::vector<int> parent;
    std::vector<int> rank;

    explicit DSU(int n) : parent(n), rank(n, 0) {
        std::iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        return parent[x] == x ? x : parent[x] = find(parent[x]);
    }

    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (rank[a] < rank[b]) std::swap(a, b);
        parent[b] = a;
        if (rank[a] == rank[b]) ++rank[a];
        return true;
    }
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) return 0;

    std::vector<Edge> edges(m);
    for (auto& e : edges) {
        std::cin >> e.u >> e.v >> e.w;
    }

    std::sort(edges.begin(), edges.end(),
              [](const Edge& a, const Edge& b) { return a.w < b.w; });

    DSU dsu(n);
    long long total = 0;
    int used = 0;
    for (const auto& e : edges) {
        if (dsu.unite(e.u, e.v)) {
            total += e.w;
            if (++used == n - 1) break;
        }
    }

    std::cout << total << '\n';
    return 0;
}
