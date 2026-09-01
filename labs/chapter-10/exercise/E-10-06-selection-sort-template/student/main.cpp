#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用选择排序把数组从小到大排序，然后一行输出（空格分隔）。
    // 提示：外层循环 i 从 0 到 n-2，
    //   每轮在未排序区间 [i, n-1] 中找到最小值的下标 minj，
    //   再把 a[i] 与 a[minj] 交换。

    return 0;
}
