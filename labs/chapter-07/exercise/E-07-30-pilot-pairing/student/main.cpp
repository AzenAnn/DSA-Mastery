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

    int leftCount, total;
    if (!(cin >> leftCount >> total)) return 0;
    vector<vector<int>> graph(leftCount + 1);
    int u, v;
    while (cin >> u >> v && !(u == -1 && v == -1)) graph[u].push_back(v);
    for (auto& neighbors : graph) {
        sort(neighbors.begin(), neighbors.end());
        neighbors.erase(unique(neighbors.begin(), neighbors.end()), neighbors.end());
    }

    // TODO: 严格按左顶点升序、邻居升序执行 DFS 增广；每轮清空右侧 visited，配对按左顶点升序输出。
    cout << 0 << '\n';
    return 0;
}
