#include <iostream>
#include <string>
#include <vector>

// 广义表长度与结点计数：显式栈一遍扫描，不使用递归。
// 栈中每个元素记录「一个已经打开的表」当前数到的顶层元素个数：
//   '('  栈非空说明这张表是某个表内部的元素 —— 子表数 +1，父表元素计数 +1；随后压入新表；
//   原子 原子总数 +1，栈非空时父表元素计数 +1；
//   ')'  弹栈；弹空说明刚结束的是最外层整表，其元素计数就是长度。
// 深度最大 10^3、输入最大 10^5，显式栈把递归调用栈搬到堆上，避免爆栈。
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::getline(std::cin, text);

    std::vector<long long> elementCount;  // 每个已打开表的顶层元素计数
    long long length = 0;                 // 长度：顶层元素个数
    long long atoms = 0;                  // 原子总数
    long long subTables = 0;              // 子表总数：不含最外层整表

    for (char ch : text) {
        if (ch == '(') {
            if (!elementCount.empty()) {  // 这张表作为元素出现在上一层表内部
                ++subTables;
                ++elementCount.back();
            }
            elementCount.push_back(0);
        } else if (ch == ')') {
            const long long elements = elementCount.back();
            elementCount.pop_back();
            if (elementCount.empty()) length = elements;  // 最外层整表结束
        } else if (ch == ',') {
            continue;  // 元素分隔符不参与计数
        } else if (ch == '\r' || ch == '\n' || ch == ' ' || ch == '\t') {
            continue;  // 输入约定不含空白，这里只做换行符的容错
        } else {
            ++atoms;
            ++elementCount.back();
        }
    }

    std::cout << length << ' ' << atoms << ' ' << subTables << '\n';
    return 0;
}
