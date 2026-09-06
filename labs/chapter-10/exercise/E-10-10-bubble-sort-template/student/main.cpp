#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用冒泡排序把数组从小到大排好序，然后按空格分隔输出。
    // 提示：外层循环 i 从 0 到 n-2，表示「第 i 趟」；
    //   内层循环 j 从 0 到 n-2-i，比较相邻的 a[j] 和 a[j+1]，
    //   若 a[j] > a[j+1] 就交换两者。每趟会把当前未排序部分的最大值移到末尾。

    return 0;
}
