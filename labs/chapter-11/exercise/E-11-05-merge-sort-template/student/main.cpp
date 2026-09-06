#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用归并排序把 a 从小到大排好序。
    // 提示：把区间递归二分到单个元素，再合并两个有序子数组。
    // 输出要求：一行，n 个整数从小到大排列，相邻数字用一个空格隔开，行末换行。

    return 0;
}
