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

    // TODO: 对隐式曼哈顿完全图运行 Prim，无需存下全部 O(n²) 条边。
    cout << 0 << '\n';
    return 0;
}
