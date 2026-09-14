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

    int tests;
    if (!(cin >> tests)) return 0;

    while (tests--) {
        int n, roads, holes;
        cin >> n >> roads >> holes;
        vector<tuple<int, int, long long>> edges;
        for (int i = 0; i < roads; ++i) {
            int u, v; long long t; cin >> u >> v >> t;
            edges.push_back({u - 1, v - 1, t});
            edges.push_back({v - 1, u - 1, t});
        }
        for (int i = 0; i < holes; ++i) {
            int u, v; long long t; cin >> u >> v >> t;
            edges.push_back({u - 1, v - 1, -t});
        }
        // TODO: 以全部顶点为起点，检查第 n 轮是否仍有松弛。
        cout << "NO\n";
    }
    return 0;
}
