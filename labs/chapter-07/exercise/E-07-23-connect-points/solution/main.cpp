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

    int n;
    if (!(cin >> n)) return 0;
    vector<pair<long long, long long>> points(n);
    for (auto& [x, y] : points) cin >> x >> y;

    const long long INF = numeric_limits<long long>::max() / 4;
    vector<long long> best(n, INF);
    vector<bool> used(n);
    best[0] = 0;
    long long total = 0;
    for (int step = 0; step < n; ++step) {
        int u = -1;
        for (int v = 0; v < n; ++v) if (!used[v] && (u == -1 || best[v] < best[u])) u = v;
        used[u] = true; total += best[u];
        for (int v = 0; v < n; ++v) if (!used[v]) {
            long long weight = abs(points[u].first - points[v].first)
                             + abs(points[u].second - points[v].second);
            best[v] = min(best[v], weight);
        }
    }
    cout << total << '\n';
    return 0;
}
