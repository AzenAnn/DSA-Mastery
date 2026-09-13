#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> a(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> a[i];
    (void)a;

    // TODO(1): 把所有值放进散列集合，支持 O(1) 的"存在性"查询，重复值自动合并。
    // TODO(2): 对每个值 v 先查 v-1 是否在集合中：在则跳过（v 不是段起点）；
    //   不在则从 v 向右扩展数 v+1, v+2, ... 直到断开，得到该段长度。
    // TODO(3): 输出最长段长。注意值域到 ±1e9，不能开值域布尔数组；
    //   千万不要对每个值都盲目向左右双向扩展——那会退化成 O(n^2)。
    // 占位输出：当前恒输出 1，仅保证可编译运行，完成 TODO 后替换。
    std::cout << 1 << '\n';
    return 0;
}
