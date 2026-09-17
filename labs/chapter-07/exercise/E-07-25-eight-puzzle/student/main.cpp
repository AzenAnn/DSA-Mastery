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

    string start;
    if (!(cin >> start)) return 0;
    const string goal = "123804765";

    // TODO: 空格用 0；以目标位置计算曼哈顿距离（不计 0），用 A* 搜索最少步数；无解输出 -1。
    cout << 0 << '\n';
    return 0;
}
