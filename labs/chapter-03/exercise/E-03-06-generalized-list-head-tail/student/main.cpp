#include <iostream>
#include <string>

int main() {
    // TODO: 实现广义表的解析、Head/Tail 操作与序列化。
    // 输入：第一行为广义表（括号表示，原子为单个小写字母，如 (a,(b,c,d))）；
    //       第二行为操作序列，由 H（Head）与 T（Tail）组成。
    // 输出：依次执行操作后的结果——原子输出字母，表输出括号表示。
    std::string expr, ops;
    std::getline(std::cin, expr);
    std::getline(std::cin, ops);
    std::cout << '\n';
    return 0;
}
