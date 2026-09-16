#include <iostream>
#include <string>
#include <vector>

int main() {
    // TODO: 读入一行串 S，求出最短循环节长度 p 与重复次数 k，输出 "p k"。
    //   1) 先用 0-based、next[0] = -1 的写法构造 next 数组，
    //      其中 next[i] 是前缀 S[0 .. i-1] 的最长公共前后缀长度；
    //   2) 候选循环节长度 p = |S| - next[|S|]；
    //   3) 只有 |S| % p == 0 时才成立，此时 k = |S| / p；
    //      否则说明不存在循环节（注意："最小周期"不等于"循环节"），输出 "|S| 1"。
    // 提示：本题 |S| 最大 10^6，枚举 p 再逐段比较的 O(|S|^2) 写法会超时。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::getline(std::cin, text);
    if (!text.empty() && text.back() == '\r') text.pop_back();

    const long long length = static_cast<long long>(text.size());

    // TODO: 在这里构造 next 数组并算出 p、k。
    std::vector<long long> next(length + 1, 0);

    std::cout << 0 << ' ' << 0 << '\n';
    return 0;
}
