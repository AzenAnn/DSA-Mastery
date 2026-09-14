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

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<vector<pair<int, int>>> graph(n);
    for (int id = 1; id <= m; ++id) {
        int u, v; cin >> u >> v;
        graph[u].push_back({v, id});
    }
    for (auto& edges : graph) sort(edges.begin(), edges.end());

    vector<int> color(n), discovered(n);
    vector<string> kind(m + 1);
    int timer = 0;
    // 栈帧保留下一个邻居的位置，行为与递归 DFS 完全一致。
    for (int root = 0; root < n; ++root) {
        if (color[root]) continue;
        vector<pair<int, size_t>> stack{{root, 0}};
        color[root] = 1;
        discovered[root] = ++timer;
        while (!stack.empty()) {
            int u = stack.back().first;
            size_t& next = stack.back().second;
            if (next == graph[u].size()) {
                color[u] = 2;
                stack.pop_back();
                continue;
            }
            auto [v, id] = graph[u][next++];
            if (color[v] == 0) {
                kind[id] = "TREE";
                color[v] = 1;
                discovered[v] = ++timer;
                stack.push_back({v, 0});
            } else if (color[v] == 1) {
                kind[id] = "BACK";
            } else {
                kind[id] = discovered[u] < discovered[v] ? "FORWARD" : "CROSS";
            }
        }
    }
    for (int id = 1; id <= m; ++id) cout << id << ' ' << kind[id] << '\n';
    return 0;
}
