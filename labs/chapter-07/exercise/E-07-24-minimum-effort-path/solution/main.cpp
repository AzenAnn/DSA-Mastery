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

    int rows, cols;
    if (!(cin >> rows >> cols)) return 0;
    vector<vector<int>> height(rows, vector<int>(cols));
    for (auto& row : height) for (int& h : row) cin >> h;

    vector<tuple<int, int, int>> edges;
    for (int r = 0; r < rows; ++r) for (int c = 0; c < cols; ++c) {
        int u = r * cols + c;
        if (r + 1 < rows) edges.push_back({abs(height[r][c] - height[r + 1][c]), u, u + cols});
        if (c + 1 < cols) edges.push_back({abs(height[r][c] - height[r][c + 1]), u, u + 1});
    }
    sort(edges.begin(), edges.end());
    DSU components(rows * cols);
    int answer = 0;
    for (auto [w, u, v] : edges) {
        components.unite(u, v);
        if (components.find(0) == components.find(rows * cols - 1)) { answer = w; break; }
    }
    cout << answer << '\n';
    return 0;
}
