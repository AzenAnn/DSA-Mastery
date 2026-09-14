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
    vector<vector<int>> reversed(n);
    vector<int> outdegree(n);
    for (int i = 0; i < m; ++i) {
        int u, v; cin >> u >> v;
        reversed[v].push_back(u); ++outdegree[u];
    }

    // TODO: 从终端点沿反向图删除出边；按编号输出所有安全点，第一行先输出数量。
    cout << 0 << '\n';
    return 0;
}
