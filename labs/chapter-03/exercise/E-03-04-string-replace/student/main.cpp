#include <iostream>
#include <string>

int main() {
    // TODO: 读入 S、T、V，把 S 中所有非重叠的 T 替换为 V 后输出。
    // 注意：替换从左到右进行，匹配结束后模式指针应归零以保证非重叠。
    std::string s, t, v;
    std::getline(std::cin, s);
    std::getline(std::cin, t);
    std::getline(std::cin, v);
    std::cout << s << '\n';
    return 0;
}
