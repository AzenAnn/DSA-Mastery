// Lab 03-E-11：KMP 全部匹配位置（允许重叠）
// 学生骨架：可编译、可运行，但尚未实现 KMP，只能拿到部分分数。
#include <iostream>
#include <string>
#include <vector>

int main() {
    // TODO: 第一行读主串 S、第二行读模式串 T。两行都可能含空格，
    //   也可能有一行是空串，所以必须用 std::getline，不能用 std::cin >>。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::string pattern;
    if (!std::getline(std::cin, text)) {
        text.clear();
    }
    if (!std::getline(std::cin, pattern)) {
        pattern.clear();
    }

    // TODO: 先求模式串 T 的 next 数组（next[j] = T[0..j] 的最长相等真前后缀长度），
    //   这样失配时可以把 j 回退到 next[j-1]，而不是从 0 重新比较。

    // TODO: 用一个变量 j 记录“当前已经匹配上的 T 的前缀长度”，线性扫描 S：
    //   1) 失配时 while (j > 0 && S[i] != T[j]) j = next[j-1];
    //   2) 相等时 ++j；
    //   3) 当 j == |T| 时记录起点 i-|T|+1，并做 j = next[j-1] 后继续
    //      —— 这一步让重叠匹配（如 ABABABA 中的 0 2 4）也能被统计到。

    // TODO: 第一行输出出现次数 c；第二行输出 c 个升序 0-based 起始下标，
    //   用单个空格分隔；c = 0 时第二行输出空行。
    (void)pattern;

    std::cout << 0 << '\n' << '\n';
    return 0;
}
