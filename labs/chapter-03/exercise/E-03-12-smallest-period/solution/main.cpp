#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    // 题面约定输入恰好是一行串 S，用 getline 整行读取更贴合语义。
    std::string text;
    std::getline(std::cin, text);
    if (!text.empty() && text.back() == '\r') text.pop_back();

    const long long length = static_cast<long long>(text.size());

    // 0-based next 数组：next[i] 为前缀 text[0 .. i-1] 的最长公共前后缀长度。
    std::vector<long long> next(length + 1, 0);
    next[0] = -1;
    long long i = 0;
    long long j = -1;
    while (i < length) {
        if (j == -1 || text[i] == text[j]) {
            ++i;
            ++j;
            next[i] = j;
        } else {
            j = next[j];
        }
    }

    // length - next[length] 是最小周期；只有整除时它才是循环节。
    const long long period = length - next[length];
    if (length % period == 0) {
        std::cout << period << ' ' << length / period << '\n';
    } else {
        std::cout << length << ' ' << 1 << '\n';
    }
    return 0;
}
