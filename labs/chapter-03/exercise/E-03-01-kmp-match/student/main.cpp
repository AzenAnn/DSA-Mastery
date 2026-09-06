#include <iostream>
#include <string>

int main() {
    // TODO: 用 KMP 求模式串在主串中首次出现的位置（0-based）。
    // 约定：next[0] = -1；空模式返回 0；未找到返回 -1。
    std::string s, p;
    std::getline(std::cin, s);
    std::getline(std::cin, p);
    std::cout << -1 << '\n';
    return 0;
}
