#include <iostream>
#include <string>

int main() {
    // TODO: 读入一行广义表（教材记法：原子为单个字母或数字；逗号分隔；括号嵌套；
    //       允许空表 ()；不含空白字符；保证最外层是括号），输出一行三个整数
    //       「长度 原子总数 子表总数」。
    // TODO: 逐个补齐下面三个量的定义（务必与题面冻结的定义一致）：
    //   1) 长度 = 顶层元素个数（原子和子表都算一个元素）；
    //   2) 原子总数 = 全表递归所有原子的个数；
    //   3) 子表总数 = 全表内部作为元素出现的表结点数，不含最外层整表；
    //      作为元素出现的空表 () 计 1 个；整个输入就是 () 时输出 0 0 0。
    // TODO: 输入最大 10^5、嵌套深度最大 10^3，请用显式栈（std::vector）一遍扫描，
    //       不要用递归，也不要用「遇见 ) 就回到上一层」的暴力回退。
    // 下面只实现了长度与原子总数，子表总数还没有实现，先原样输出占位值 0。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::getline(std::cin, text);

    long long length = 0;     // 顶层元素个数
    long long atoms = 0;      // 原子总数（全表递归）
    long long subTables = 0;  // TODO: 子表总数，尚未实现

    int depth = 0;                 // 当前已打开的括号层数
    bool expectingElement = false;  // 是否正处在一个新元素的开头

    for (char ch : text) {
        if (ch == '(') {
            if (expectingElement && depth == 1) ++length;  // 顶层位置上的子表也是一个元素
            ++depth;
            expectingElement = true;
        } else if (ch == ')') {
            --depth;
            expectingElement = false;
        } else if (ch == ',') {
            expectingElement = true;
        } else if (ch == '\r' || ch == '\n' || ch == ' ' || ch == '\t') {
            continue;
        } else {
            ++atoms;
            if (expectingElement && depth == 1) ++length;
            expectingElement = false;
        }
    }

    std::cout << length << ' ' << atoms << ' ' << subTables << '\n';
    return 0;
}
