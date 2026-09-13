// Lab 08-E-03 参考实现：非递减序列上的左右边界双折半查找。
// 每个查询输出目标值首次与末次出现的下标（1 起），不存在输出 -1 -1。
#include <iostream>
#include <vector>

// 循环不变量：首次出现位置若存在，必落在 [low, high] 内。
int firstPos(const std::vector<int>& a, int key) {
    int low = 0, high = static_cast<int>(a.size()) - 1;
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
    return answer;
}

// 循环不变量：末次出现位置若存在，必落在 [low, high] 内。
int lastPos(const std::vector<int>& a, int key) {
    int low = 0, high = static_cast<int>(a.size()) - 1;
    int answer = -1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (a[mid] <= key) {
            if (a[mid] == key) answer = mid;
            low = mid + 1;  // 继续向右找更晚的出现
        } else {
            high = mid - 1;
        }
    }
    return answer;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0, q = 0;
    if (!(std::cin >> n >> q)) return 0;

    std::vector<int> a(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> a[i];

    for (int t = 0; t < q; ++t) {
        int key = 0;
        std::cin >> key;
        int first = firstPos(a, key);
        if (first < 0) {
            std::cout << -1 << ' ' << -1 << '\n';
        } else {
            std::cout << first + 1 << ' ' << lastPos(a, key) + 1 << '\n';
        }
    }
    return 0;
}
