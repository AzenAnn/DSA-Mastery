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

    // TODO: 将相邻格子的高度差作为无向边权；按权重合并，首次连接起终点时得到瓶颈值。
    cout << 0 << '\n';
    return 0;
}
