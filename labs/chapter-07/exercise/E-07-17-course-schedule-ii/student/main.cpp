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
        int a, b; cin >> a >> b;
        graph[b].push_back(a); ++indegree[a];
    }

    // TODO: 每次选当前编号最小的零入度顶点，得到字典序最小拓扑序；有环输出 -1。
    cout << 0 << '\n';
    return 0;
}
