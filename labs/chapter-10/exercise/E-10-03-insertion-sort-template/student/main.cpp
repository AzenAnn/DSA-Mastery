#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用插入排序把 a 从小到大排序并输出。
    // 提示（插入排序模板）：
    //   for (i = 1; i < n; ++i) {
    //       key = a[i];
    //       j = i - 1;
    //       while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; --j; }
    //       a[j + 1] = key;
    //   }
    // 输出时数字之间用一个空格分隔，行尾换行。

    return 0;
}
