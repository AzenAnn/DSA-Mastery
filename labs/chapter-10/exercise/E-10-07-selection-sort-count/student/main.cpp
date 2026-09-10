#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用选择排序排序，并统计交换次数 sw。
    // 提示：每轮在 [i, n-1] 中找到最小值下标 minj；
    //   只有当 minj != i 时才真正交换，并让 sw 加 1。
    // 输出：第一行排序后的数组（空格分隔），第二行交换次数。

    return 0;
}
