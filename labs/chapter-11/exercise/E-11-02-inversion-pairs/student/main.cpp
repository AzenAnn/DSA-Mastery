#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用归并排序统计逆序对数量。
    // 提示：在「合并两个有序子数组」时统计——
    //   当右半 a[j] < 左半 a[i] 时，左半从 i 到 mid 的所有元素都与 a[j] 构成逆序对，
    //   一次加上 (mid - i + 1) 个。
    // 注意：答案用 long long（最多约 n(n-1)/2 个，n 大时会超 int）。

    return 0;
}
