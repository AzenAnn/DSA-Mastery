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
    vector<vector<int>> graph(n);
    vector<int> indegree(n);
    for (int i = 0; i < m; ++i) {
        int a, b; cin >> a >> b; --a; --b;
        graph[a].push_back(b); ++indegree[b];
    }

    // TODO: 源点计数初始化为 1，按拓扑序累加到后继，对 80112002 取模，汇总所有汇点。
    cout << 0 << '\n';
    return 0;
}
