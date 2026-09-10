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

    // TODO: 用希尔排序（增量序列 3*g+1）从小到大排序，并统计交换次数。
    // 提示：
    //   1. 先生成 gap 序列 g = 1, 4, 13, ...（每次 g = 3*g + 1），只保留 <= n 的，再倒序使用；
    //   2. 对每个 gap 做一次「间隔为 gap 的插入排序」，插入时元素每后移 gap 位，交换次数 +1；
    //   3. 输出：第一行 gap 个数 m；第二行 m 个 gap（降序、空格分隔）；
    //      第三行交换次数（用 long long 存）；之后 n 行每行一个数（排序结果）。
    // 注意：n 可到 10^6，交换次数可能很大，用 long long。

    return 0;
}
