#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 实现 LSD 基数排序。
    // 提示：
    //   1. 先找最大值 maxv，决定要处理多少轮（exp = 1, 10, 100, ...）；
    //   2. 每轮用计数排序按 (x / exp) % 10 这一位对数组做稳定排序；
    //   3. 计数排序的「放置」步骤要从后往前遍历，才能保证稳定。
    // 排序完成后，从小到大输出 a 的每个元素。

    return 0;
}
