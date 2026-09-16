#include <iostream>
#include <string>
#include <vector>

// Lab 03-E-17：KMP 与 nextval 的比较次数
// 计数口径（与题面冻结一致）：每次执行一次 S[i] == T[j] 的字符比较计 1 次，
// 成功与失败都计；构造 next / nextval 阶段的比较不计入；
// KMP 中 j == -1 的推进不发生字符比较，不计次；
// 一旦 j 到达 |T|（首次匹配成功）立即结束，不再扫描主串剩余部分。

// 0-based、next[0] = -1 约定：next[j] 是 T[0..j-1] 的最长相等真前后缀长度。
std::vector<int> buildNext(const std::string &pattern) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> next(static_cast<std::size_t>(m), -1);
    int k = -1;
    int j = 0;
    while (j < m - 1) {
        if (k == -1 || pattern[j] == pattern[k]) {
            ++j;
            ++k;
            next[static_cast<std::size_t>(j)] = k;
        } else {
            k = next[static_cast<std::size_t>(k)];
        }
    }
    return next;
}

// nextval：若 T[j] == T[next[j]]，说明回退到 next[j] 后必然再次失配，直接压到 nextval[next[j]]。
std::vector<int> buildNextval(const std::string &pattern, const std::vector<int> &next) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> nextval(static_cast<std::size_t>(m), -1);
    for (int j = 1; j < m; ++j) {
        const int k = next[static_cast<std::size_t>(j)];
        // k == -1 时不存在 pattern[k]，按定义 nextval[j] = -1（与题目伪代码一致）。
        nextval[static_cast<std::size_t>(j)] =
            (k >= 0 && pattern[static_cast<std::size_t>(j)] == pattern[static_cast<std::size_t>(k)])
                ? nextval[static_cast<std::size_t>(k)]
                : k;
    }
    return nextval;
}

long long countNaive(const std::string &text, const std::string &pattern) {
    const long long n = static_cast<long long>(text.size());
    const long long m = static_cast<long long>(pattern.size());
    long long i = 0;
    long long j = 0;
    long long count = 0;
    while (i < n && j < m) {
        ++count;
        if (text[static_cast<std::size_t>(i)] == pattern[static_cast<std::size_t>(j)]) {
            ++i;
            ++j;
        } else {
            i = i - j + 1;
            j = 0;
        }
    }
    return count;
}

long long countKmp(const std::string &text, const std::string &pattern, const std::vector<int> &table) {
    const long long n = static_cast<long long>(text.size());
    const long long m = static_cast<long long>(pattern.size());
    long long i = 0;
    long long j = 0;
    long long count = 0;
    while (i < n && j < m) {
        if (j == -1) {
            ++i;
            ++j;
            continue;
        }
        ++count;
        if (text[static_cast<std::size_t>(i)] == pattern[static_cast<std::size_t>(j)]) {
            ++i;
            ++j;
        } else {
            j = table[static_cast<std::size_t>(j)];
        }
    }
    return count;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::string pattern;
    if (!std::getline(std::cin, text)) text.clear();
    if (!std::getline(std::cin, pattern)) pattern.clear();

    const std::vector<int> next = buildNext(pattern);
    const std::vector<int> nextval = buildNextval(pattern, next);

    std::cout << countNaive(text, pattern) << ' '
              << countKmp(text, pattern, next) << ' '
              << countKmp(text, pattern, nextval) << '\n';
    return 0;
}
