#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int childCount = 0;
    int cookieCount = 0;
    if (!(std::cin >> childCount >> cookieCount)) return 0;

    std::vector<int> greed(childCount);
    std::vector<int> cookies(cookieCount);
    for (int& value : greed) std::cin >> value;
    for (int& value : cookies) std::cin >> value;

    // 学生需要在这里完成排序与贪心匹配。
    std::cout << 0 << '\n';
    return 0;
}
