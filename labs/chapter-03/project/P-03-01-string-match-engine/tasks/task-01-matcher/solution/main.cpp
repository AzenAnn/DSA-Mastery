#include <iostream>
#include <string>
#include <vector>

namespace {

struct Result {
    long long first = -1;        // -1 表示未找到
    long long comparisons = 0;   // 匹配阶段字符比较次数（含失配）
    long long prefix = 0;        // next/nextval 构建字符比较次数
};

// 计数版 build_next：只统计真实执行的字符比较（k == -1 时不比较）。
std::vector<int> build_next_counted(const std::string& pattern, long long& prefix) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> next(m, 0);
    int k = -1, j = 0;
    next[0] = -1;
    while (j < m - 1) {
        if (k == -1) {
            ++j;
            ++k;
            next[j] = k;
        } else {
            ++prefix;
            if (pattern[j] == pattern[k]) {
                ++j;
                ++k;
                next[j] = k;
            } else {
                k = next[k];
            }
        }
    }
    return next;
}

std::vector<int> nextval_from_next(const std::string& pattern, const std::vector<int>& next) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> nextval(m, 0);
    nextval[0] = -1;
    for (int j = 1; j < m; ++j) {
        const int k = next[j];
        nextval[j] = (pattern[j] == pattern[k]) ? nextval[k] : k;
    }
    return nextval;
}

Result naive_match(const std::string& text, const std::string& pattern) {
    Result r;
    const int n = static_cast<int>(text.size());
    const int m = static_cast<int>(pattern.size());
    if (m == 0) {
        r.first = 0;
        return r;
    }
    int i = 0, j = 0;
    while (i < n && j < m) {
        ++r.comparisons;
        if (text[i] == pattern[j]) {
            ++i;
            ++j;
        } else {
            i = i - j + 1;
            j = 0;
        }
    }
    if (j == m) r.first = i - m;
    return r;
}

Result kmp_match(const std::string& text, const std::string& pattern, bool nextval_mode) {
    Result r;
    const int n = static_cast<int>(text.size());
    const int m = static_cast<int>(pattern.size());
    if (m == 0) {
        r.first = 0;
        return r;
    }
    std::vector<int> table;
    if (nextval_mode) {
        table = nextval_from_next(pattern, build_next_counted(pattern, r.prefix));
    } else {
        table = build_next_counted(pattern, r.prefix);
    }
    int i = 0, j = 0;
    while (i < n && j < m) {
        if (j == -1) {
            ++i;
            ++j;
            continue;
        }
        ++r.comparisons;
        if (text[i] == pattern[j]) {
            ++i;
            ++j;
        } else {
            j = table[j];
        }
    }
    if (j == m) r.first = i - m;
    return r;
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string text, pattern;
    if (!std::getline(std::cin, text) || !std::getline(std::cin, pattern)) {
        std::cerr << "error: expected two lines: text, then pattern\n";
        return 1;
    }
    const Result naive = naive_match(text, pattern);
    const Result kmp = kmp_match(text, pattern, false);
    const Result nextval = kmp_match(text, pattern, true);
    std::cout << "naive first=" << naive.first
              << " comparisons=" << naive.comparisons
              << " prefix=" << naive.prefix << '\n';
    std::cout << "kmp first=" << kmp.first
              << " comparisons=" << kmp.comparisons
              << " prefix=" << kmp.prefix << '\n';
    std::cout << "nextval first=" << nextval.first
              << " comparisons=" << nextval.comparisons
              << " prefix=" << nextval.prefix << '\n';
    return 0;
}
