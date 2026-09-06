#include <algorithm>
#include <iostream>
#include <string>

// 递归求深度：空表返回 1，原子返回 0，非空表返回 max(元素深度)+1。
// pos 始终指向待解析字符；调用返回时 pos 已越过刚解析的元素。
int depth(const std::string& s, int& pos) {
    while (pos < (int)s.size() && s[pos] == ' ') ++pos;
    if (s[pos] == '(') {
        ++pos;
        while (pos < (int)s.size() && s[pos] == ' ') ++pos;
        if (s[pos] == ')') {  // 空表
            ++pos;
            return 1;
        }
        int maxDepth = 0;
        while (true) {
            while (pos < (int)s.size() && s[pos] == ' ') ++pos;
            maxDepth = std::max(maxDepth, depth(s, pos));
            while (pos < (int)s.size() && s[pos] == ' ') ++pos;
            if (s[pos] == ',') {
                ++pos;
                continue;
            } else if (s[pos] == ')') {
                ++pos;
                break;
            }
        }
        return maxDepth + 1;
    } else {  // 原子（单个字符）
        ++pos;
        return 0;
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string expr;
    std::getline(std::cin, expr);
    int pos = 0;
    std::cout << depth(expr, pos) << '\n';
    return 0;
}
