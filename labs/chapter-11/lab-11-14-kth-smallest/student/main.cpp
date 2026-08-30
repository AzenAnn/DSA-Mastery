#include <cstdio>
#include <algorithm>
using namespace std;

const int MAXN = 5000000 + 5;
int a[MAXN];

int main() {
    int n, k;
    scanf("%d %d", &n, &k);
    for (int i = 0; i < n; ++i) scanf("%d", &a[i]);

    // TODO: 用快速选择（quickselect）求第 k 小的数，不要全排序。
    // 提示：先 --k 转成 0 起下标，再在 [l, r] 里做三路划分——
    //   [l, i-1] 小于 pivot、[i, j] 等于 pivot、[j+1, r] 大于 pivot；
    //   若 k 落在等于区就输出 pivot，否则只递归/迭代其中一侧。
    // 注意 n 极大：用 scanf 读入，且不要用 O(n log n) 的全排序。

    return 0;
}
