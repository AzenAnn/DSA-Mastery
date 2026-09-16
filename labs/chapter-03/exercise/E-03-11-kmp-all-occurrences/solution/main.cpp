// Lab 03-E-11：KMP 全部匹配位置（允许重叠）
// 参考实现：先求模式串的 next（最长相等前后缀）数组，再线性扫描主串，
// 每次匹配成功后把模式串右移一位继续匹配，从而统计出所有允许重叠的出现位置。
// 时间复杂度 O(|S| + |T|)，空间复杂度 O(|T|)。
#include <iostream>
#include <string>
#include <vector>

// 求模式串的 next 数组（教材记法）：next[j] 表示 T[0..j] 的最长相等真前后缀长度。
// 这里采用 0-based 写法：next[0] = 0，失配时回退到 next[j-1]。
std::vector<int> buildNext(const std::string &pattern) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> next(m, 0);
    for (int j = 1; j < m; ++j) {
        int k = next[j - 1];
        while (k > 0 && pattern[j] != pattern[k]) {
            k = next[k - 1];
        }
        if (pattern[j] == pattern[k]) {
            ++k;
        }
        next[j] = k;
    }
    return next;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    // 两行都可能含空格，也可能为空串，必须整行读入。
    std::string text;
    std::string pattern;
    if (!std::getline(std::cin, text)) {
        text.clear();
    }
    if (!std::getline(std::cin, pattern)) {
        pattern.clear();
    }

    const int n = static_cast<int>(text.size());
    const int m = static_cast<int>(pattern.size());

    // 本题约定 1 <= |T|：空模式没有定义，保险起见直接输出 0 次。
    if (m == 0 || m > n) {
        std::cout << 0 << '\n' << '\n';
        return 0;
    }

    const std::vector<int> next = buildNext(pattern);

    std::vector<int> occurrences;
    occurrences.reserve(static_cast<std::size_t>(n) / static_cast<std::size_t>(m) + 1);

    int j = 0; // 当前已匹配的模式串前缀长度
    for (int i = 0; i < n; ++i) {
        while (j > 0 && text[i] != pattern[j]) {
            j = next[j - 1];
        }
        if (text[i] == pattern[j]) {
            ++j;
        }
        if (j == m) {
            occurrences.push_back(i - m + 1);
            // 允许重叠：只回退一位，而不是把 j 清零。
            j = next[j - 1];
        }
    }

    std::cout << occurrences.size() << '\n';
    for (std::size_t index = 0; index < occurrences.size(); ++index) {
        if (index > 0) {
            std::cout << ' ';
        }
        std::cout << occurrences[index];
    }
    std::cout << '\n';
    return 0;
}
