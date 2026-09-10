#include <iostream>
#include <string>

int main() {
    // TODO: 实现广义表深度的递归计算。
    // 输入：一行广义表（括号表示，原子为单个小写字母）。
    // 深度约定：空表 () 深度为 1，原子深度为 0，非空表深度 = max(元素深度) + 1。
    std::string expr;
    std::getline(std::cin, expr);
    std::cout << 0 << '\n';
    return 0;
}
