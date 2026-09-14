// Lab 08-E-02 参考实现：非递减序列上的左边界折半查找。
// 每次查询输出目标值首次出现的下标（1 起）或 -1。
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

    for (long long q = 0; q < m; ++q) {
        int key = 0;
        std::cin >> key;

        // 循环不变量：首次出现位置若存在，必在 [low, high] 内。
        int low = 0, high = n - 1;
        int answer = -1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (a[mid] >= key) {
                if (a[mid] == key) answer = mid;
                high = mid - 1;  // 继续向左找更早的出现
            } else {
                low = mid + 1;
            }
        }
        std::cout << (answer < 0 ? -1 : answer + 1) << '\n';
    }
    return 0;
}
