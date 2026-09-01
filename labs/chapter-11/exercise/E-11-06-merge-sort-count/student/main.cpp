#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用归并排序把 a 从小到大排好序，并统计排序过程中的「比较次数」。
    // 提示：
    //   1. 合并两个有序子数组时，用双指针比较并选取较小元素；
    //   2. 采用哨兵（无穷大）写法时，每写入一个元素都对应一次比较；
    //      若用 while 循环写法，则一侧耗尽后剩余元素直接拷贝，不再计数。
    // 输出要求：
    //   第一行：排序后的 n 个整数，用空格隔开；
    //   第二行：比较次数。

    return 0;
}
