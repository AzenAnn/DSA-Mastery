#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n), b(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 实现 LSD 基数排序，并在每轮结束后输出数组。
    // 提示：
    //   1. 值域 0..999，共 3 轮：exp = 1（个位）、10（十位）、100（百位）；
    //   2. 每轮用计数排序按 (x / exp) % 10 稳定排序；
    //   3. 计数排序的「放置」从后往前遍历，保证稳定；
    //   4. 每轮排序后，把数组按「空格分隔」输出一行。

    return 0;
}
