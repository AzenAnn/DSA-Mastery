#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    long long m = 0;
    if (!(std::cin >> n >> m)) return 0;

    std::vector<int> a(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> a[i];

    // TODO(1): 对每个查询值 key，在非递减序列 a 上做折半查找。
    // 要求返回首次出现的下标（1 起）；不存在输出 -1。
    // 注意：命中 a[mid] == key 时不能直接返回，需继续向左确认首次出现。
    // TODO(2): 用 long long 读入查询计数 m，查询值可能为负或超过 1e9。
    long long queries = m;
    while (queries-- > 0) {
        int key = 0;
        std::cin >> key;
        (void)a;
        std::cout << -1 << '\n';
    }
    return 0;
}
