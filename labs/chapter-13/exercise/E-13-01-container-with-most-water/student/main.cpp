#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> height(n);
    for (long long& value : height) std::cin >> value;

    // 学生需要在这里完成最大容水量算法。
    std::cout << 0 << '\n';
    return 0;
}
