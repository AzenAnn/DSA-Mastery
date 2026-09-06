#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用选择排序统计总交换次数，只输出这个次数。
    // 提示：每轮在 [i, n-1] 中找到最小值下标 minj；
    //   只有当 minj != i 时才交换，并把交换次数加 1。
    // 注意 n 可达 8000，O(n^2) 可以通过；交换次数最多 n-1，用 int 足够。

    return 0;
}
