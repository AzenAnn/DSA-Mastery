// Lab 03-E-20：Head/Tail 复合运算求值（参考实现）
//
// 关键认识：Tail 返回的是一张**新表**，所以当前表恒好写成
//     「一对圆括号 + 原串中的一段元素区间 [left, right]」
// 括号层数不会随 Tail 累积（这正是最容易写错的地方）。
//
//   H（表头）：表头就是 left 处的那个元素，结果可能是原子，也可能是子表；
//             若表头是子表 T[left..mate[left]]，当前表就变成这张子表的内容区间。
//   T（表尾）：跳过表头元素，右边界不变，外层仍是一对括号。
//
// 预处理一次括号配对后，每个操作只移动 O(1) 个游标，总时间 O(|表| + |ops|)。
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;  // 第一行：广义表（教材记法，无空白）
    std::string ops;   // 第二行：只含 H/T 的操作序列
    std::getline(std::cin, text);
    std::getline(std::cin, ops);

    const int n = static_cast<int>(text.size());
    if (n == 0) {
        std::cout << "()" << '\n';
        return 0;
    }

    // 预处理：每个括号的配对位置。
    std::vector<int> mate(static_cast<std::size_t>(n), -1);
    std::vector<int> stack;
    stack.reserve(static_cast<std::size_t>(n));
    for (int i = 0; i < n; ++i) {
        if (text[static_cast<std::size_t>(i)] == '(') {
            stack.push_back(i);
        } else if (text[static_cast<std::size_t>(i)] == ')') {
            const int open = stack.back();
            stack.pop_back();
            mate[static_cast<std::size_t>(open)] = i;
            mate[static_cast<std::size_t>(i)] = open;
        }
    }

    // 当前表 = "(" + text[left..right] + ")"；初始是最外层整表去掉它自己的括号。
    int left = 1;
    int right = mate[0] - 1;
    bool headIsAtom = false;  // 最后一步 H 取到原子时，结果就是这个字符
    int atomPos = -1;

    for (std::size_t k = 0; k < ops.size(); ++k) {
        // 当前表头元素在 text 中的结束位置：原子是自身，子表是对应的右括号。
        const int headEnd = (text[static_cast<std::size_t>(left)] == '(')
                                ? mate[static_cast<std::size_t>(left)]
                                : left;
        if (ops[k] == 'H') {
            if (text[static_cast<std::size_t>(left)] == '(') {
                // 表头是子表：当前表变成这张子表（仍然是一对括号 + 一段区间）。
                left = left + 1;
                right = headEnd - 1;
                headIsAtom = false;
            } else {
                // 表头是原子；题目保证此后不再有操作。
                headIsAtom = true;
                atomPos = left;
            }
        } else {
            // 表尾：跳过表头元素（以及紧随其后的逗号），右边界不变。
            int newLeft = headEnd + 1;
            if (newLeft <= right && text[static_cast<std::size_t>(newLeft)] == ',') {
                ++newLeft;
            }
            left = newLeft;
            headIsAtom = false;
        }
    }

    if (headIsAtom) {
        std::cout << text[static_cast<std::size_t>(atomPos)] << '\n';
    } else if (left > right) {
        std::cout << "()" << '\n';
    } else {
        std::cout << '(' << text.substr(static_cast<std::size_t>(left),
                                        static_cast<std::size_t>(right - left + 1))
                  << ')' << '\n';
    }
    return 0;
}
