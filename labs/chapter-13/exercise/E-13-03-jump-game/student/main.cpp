#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<int> nums(n);
    for (int& value : nums) std::cin >> value;

    // 学生需要在这里完成跳跃可达性判断。
    std::cout << "false\n";
    return 0;
}
