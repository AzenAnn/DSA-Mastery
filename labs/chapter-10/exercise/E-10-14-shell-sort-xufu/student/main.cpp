#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用希尔排序（增量序列 3*g+1）从小到大排序。
    // 提示：
    //   1. 生成增量序列 g = 1, 4, 13, ...（每次 g = 3*g + 1），只保留 <= n 的；
    //   2. 依次对每个 g 做「间隔为 g 的插入排序」；
    //   3. 排序后把 n 个数输出到一行，空格分隔。

    return 0;
}
