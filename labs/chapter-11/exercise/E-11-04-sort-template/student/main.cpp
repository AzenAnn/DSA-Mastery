#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用归并排序（或任意 O(n log n) 的排序算法）把 a 从小到大排好序。
    // 提示：归并排序 = 递归地把数组分成两半排好，再合并两个有序子数组。
    // 输出要求：一行，n 个整数从小到大排列，相邻数字用一个空格隔开，行末换行。

    return 0;
}
