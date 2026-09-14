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

    int leftCount, rightCount, m;
    if (!(cin >> leftCount >> rightCount >> m)) return 0;
    vector<vector<int>> graph(leftCount);
    for (int i = 0; i < m; ++i) {
        int u, v; cin >> u >> v;
        graph[u - 1].push_back(v - 1);
    }

    // TODO: 逐个左顶点尝试增广，每次重置右顶点访问标记，输出最大匹配数。
    cout << 0 << '\n';
    return 0;
}
