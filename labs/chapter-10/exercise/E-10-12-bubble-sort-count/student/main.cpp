#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用冒泡排序从小到大排序，并统计相邻交换次数。
    //   第一行输出排序后的数组（空格分隔），第二行输出交换次数。
    // 提示：在冒泡排序的「相邻两两比较」处，发生 swap 就 cnt++。

    return 0;
}
