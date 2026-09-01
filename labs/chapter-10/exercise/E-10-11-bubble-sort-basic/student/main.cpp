#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用冒泡排序从小到大排序，并统计相邻交换的总次数，输出该次数。
    // 提示：在冒泡排序的「相邻两两比较」处，只要发生 swap 就 cnt++。
    //   最终输出 cnt。升序数组 cnt 为 0，降序数组 cnt 最多为 n(n-1)/2。

    return 0;
}
