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

    vector<int> matched(total + 1, 0);
    vector<bool> seen(total + 1);
    function<bool(int)> augment = [&](int a) {
        for (int b : graph[a]) {
            if (seen[b]) continue;
            seen[b] = true;
            if (matched[b] == 0 || augment(matched[b])) {
                matched[b] = a; return true;
            }
        }
        return false;
    };
    int count = 0;
    for (int a = 1; a <= leftCount; ++a) {
        fill(seen.begin(), seen.end(), false);
        if (augment(a)) ++count;
    }
    cout << count << '\n';
    vector<int> partner(leftCount + 1, 0);
    for (int b = leftCount + 1; b <= total; ++b) if (matched[b]) partner[matched[b]] = b;
    for (int a = 1; a <= leftCount; ++a) if (partner[a]) cout << a << ' ' << partner[a] << '\n';
    return 0;
}
