#include <algorithm>
#include <array>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <limits>
#include <numeric>
#include <queue>
#include <string>
#include <tuple>
#include <unordered_map>
#include <utility>
#include <vector>

using namespace std;

struct DSU {
    vector<int> parent, size;
    explicit DSU(int n) : parent(n), size(n, 1) { iota(parent.begin(), parent.end(), 0); }
    int find(int u) {
        while (parent[u] != u) { parent[u] = parent[parent[u]]; u = parent[u]; }
        return u;
    }
    bool unite(int u, int v) {
        u = find(u); v = find(v);
        if (u == v) return false;
        if (size[u] < size[v]) swap(u, v);
        parent[v] = u; size[u] += size[v];
        return true;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<tuple<long long, int, int>> edges;
    for (int i = 0; i < m; ++i) {
        int u, v; long long w; cin >> u >> v >> w;
        edges.push_back({w, u - 1, v - 1});
    }

    sort(edges.begin(), edges.end());
    DSU components(n);
    int selected = 0;
    long long cost = 0;
    for (auto [w, u, v] : edges) if (components.unite(u, v)) {
        cost += w; ++selected;
    }
    cout << (selected == n - 1 ? cost : -1) << '\n';
    return 0;
}
