#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0, q = 0;
    if (!(std::cin >> n >> q)) return 0;

    std::vector<int> a(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> a[i];

    // TODO(1): 对每个查询值 key 做两次折半：左边界找首次出现下标，
    //          右边界找末次出现下标；不存在输出 -1 -1。
    // 注意：命中 a[mid] == key 时不能直接返回，两个方向都要继续收缩才能拿到边界。
    // TODO(2): 查询值可能为负或超出序列取值范围；下标从 1 开始输出。
    for (int t = 0; t < q; ++t) {
        int key = 0;
        std::cin >> key;
        (void)a;
        std::cout << -1 << ' ' << -1 << '\n';
    }
    return 0;
}
