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
        int a, b; cin >> a >> b; // 先修 b，再修 a。
        graph[b].push_back(a); ++indegree[a];
    }

    // TODO: 使用 Kahn 拓扑排序；移除全部 n 门课程时输出 YES，否则输出 NO。
    cout << 0 << '\n';
    return 0;
}
