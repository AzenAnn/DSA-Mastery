#include <iostream>
#include <string>

int main() {
    // TODO: 统计朴素匹配与 KMP 匹配阶段的字符比较次数，各占一行输出。
    // 统计口径见 README：j == -1 分支不计次；KMP 的 next 构建不计入。
    std::string s, p;
    std::getline(std::cin, s);
    std::getline(std::cin, p);
    std::cout << 0 << '\n';
    std::cout << 0 << '\n';
    return 0;
}
