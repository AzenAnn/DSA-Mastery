// Lab 03-E-20：Head/Tail 复合运算求值（学生骨架）
//
// 这份骨架只做了**第一步**操作，就把它当成了最终结果。它有两个必须由你补完的地方：
//
// TODO(1) 复合运算。题目给出的是一串操作，每一步都要作用在上一步的结果上：
//         Tail(Tail((a,b,c))) = (c)，而不是 Tail 一次的结果。当前实现拿到
//         ops[0] 之后就直接输出，凡是操作数大于 1 的用例都会错。
//         还要注意：Head 的结果可能是原子也可能是子表，只有子表才能继续操作
//         （题目保证输入合法，不会对原子再取 Head/Tail）。
//
// TODO(2) 复杂度。本题要求 O(|表| + 操作数)。若每一步都对「当前表」做一次
//         O(|表|) 的括号配对与子串复制，总代价是 O(|表| × 操作数) 级：
//         一份语义正确的朴素实现在 |表|≈10⁵、操作数≈5×10⁴ 时实测已约 1.2 秒，
//         而本题压力点是 |表|≈5×10⁵、操作数≈2.5×10⁵（约 25 倍工作量），必然超时。
//         正确做法：对原始输入只做一次括号配对，然后用 (left, right) 两个游标
//         表示「当前表的内容区间」——当前表恒等于 "(" + text[left..right] + ")"：
//           - H：表头就是 left 处的元素；若它是子表，就把区间收进这张子表；
//           - T：跳过表头元素（以及紧随其后的逗号），右边界不变；
//         最后一次性拼出结果，任何一步都不要复制子串。
#include <iostream>
#include <string>
#include <vector>

namespace {

// 每个位置配对的括号位置；原子的位置填自身。
std::vector<int> buildMate(const std::string& text) {
    const int n = static_cast<int>(text.size());
    std::vector<int> mate(n, -1);
    std::vector<int> stack;
    for (int i = 0; i < n; ++i) {
        if (text[i] == '(') {
            stack.push_back(i);
        } else if (text[i] == ')') {
            const int open = stack.back();
            stack.pop_back();
            mate[open] = i;
            mate[i] = open;
        }
    }
    return mate;
}

// 取表头：当前表的第一个元素，可能是原子也可能是子表。
std::string headOf(const std::string& text) {
    const std::vector<int> mate = buildMate(text);
    const int body = 1;                                     // 跳过最外层左括号
    const int end = text[body] == '(' ? mate[body] : body;   // 表头元素的结束位置
    return text.substr(body, static_cast<std::size_t>(end - body + 1));
}

// 取表尾：去掉表头后剩下的元素**再组成一张表**，所以要多套一层括号。
std::string tailOf(const std::string& text) {
    const std::vector<int> mate = buildMate(text);
    const int body = 1;
    const int end = text[body] == '(' ? mate[body] : body;
    int next = end + 1;
    if (next < static_cast<int>(text.size()) && text[next] == ',') ++next;  // 跳过分隔逗号
    const int close = static_cast<int>(text.size()) - 1;                     // 本表的右括号
    return "(" + text.substr(next, static_cast<std::size_t>(close - next)) + ")";
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::string ops;
    std::getline(std::cin, text);
    std::getline(std::cin, ops);

    // TODO(1) 这里只执行了第一步。请把它改成对整串 ops 依次求值。
    if (ops.empty()) {
        std::cout << text << '\n';
        return 0;
    }
    const std::string first = (ops[0] == 'H') ? headOf(text) : tailOf(text);
    std::cout << first << '\n';
    return 0;
}
