#include <iostream>
#include <string>

int main() {
    // TODO: 读入一行 UTF-8 文本，输出总字节数与字符数（按首字节判定字符长度）。
    std::string line;
    std::getline(std::cin, line);
    std::cout << line.size() << '\n';
    std::cout << 0 << '\n';
    return 0;
}
