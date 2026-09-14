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

    vector<int> matched(rightCount, -1);
    vector<bool> seen(rightCount);
    function<bool(int)> augment = [&](int u) {
        for (int v : graph[u]) {
            if (seen[v]) continue;
            seen[v] = true;
            if (matched[v] == -1 || augment(matched[v])) {
                matched[v] = u; return true;
            }
        }
        return false;
    };
    int answer = 0;
    for (int u = 0; u < leftCount; ++u) {
        fill(seen.begin(), seen.end(), false);
        if (augment(u)) ++answer;
    }
    cout << answer << '\n';
    return 0;
}
