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

    int rows, cols;
    if (!(cin >> rows >> cols)) return 0;
    vector<vector<int>> grid(rows, vector<int>(cols));
    for (auto& row : grid) for (int& cell : row) cin >> cell;

    // TODO: 用 f=g+曼哈顿距离 的最小堆展开状态；跳过过期条目，终点弹出时返回 g。
    cout << 0 << '\n';
    return 0;
}
