#include <iostream>
#include <string>
#include <vector>

// 可编译的起点：朴素匹配已实现；KMP / nextval 先用朴素结果占位，
// 首次出现位置正确，但比较次数与 prefix 口径尚未按要求实现。

namespace {

struct Result {
    long long first = -1;
    long long comparisons = 0;
    long long prefix = 0;
};

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

// TODO: 实现 KMP（next 版）与 nextval 版的匹配与比较次数统计。
// 约定：0-based、next[0] = -1；匹配阶段比较次数含失配；构建比较次数单独计。
Result kmp_match(const std::string& text, const std::string& pattern, bool /*nextval_mode*/) {
    return naive_match(text, pattern);
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
