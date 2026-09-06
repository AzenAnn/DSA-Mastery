#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 去重后从小到大取第 k 小的整数；若去重后不足 k 个，输出 "NO RESULT"。
    // 提示：先 sort(a.begin(), a.end())，再用 unique 把重复元素集中到末尾，
    //   erase 掉多余部分；然后比较去重后的长度与 k。

    return 0;
}
