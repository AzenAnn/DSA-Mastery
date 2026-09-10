#include "matcher.hpp"

#include <cstdint>
#include <string_view>
#include <vector>

namespace dsa {

namespace {

std::vector<int> build_next_counted(std::string_view pattern, std::uint64_t& comparisons) {
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
            ++comparisons;
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

std::vector<int> nextval_from_next(std::string_view pattern, const std::vector<int>& next) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> nextval(m, 0);
    nextval[0] = -1;
    for (int j = 1; j < m; ++j) {
        const int k = next[j];
        nextval[j] = (pattern[j] == pattern[k]) ? nextval[k] : k;
    }
    return nextval;
}

}  // namespace

std::vector<int> build_next(std::string_view pattern) {
    std::uint64_t ignored = 0;
    return build_next_counted(pattern, ignored);
}

std::vector<int> build_nextval(std::string_view pattern) {
    return nextval_from_next(pattern, build_next(pattern));
}

MatchOutcome NaiveMatcher::first(std::string_view text, std::string_view pattern) const {
    MatchOutcome outcome;
    const int n = static_cast<int>(text.size());
    const int m = static_cast<int>(pattern.size());
    if (m == 0) {
        outcome.first = 0;
        return outcome;
    }
    int i = 0, j = 0;
    while (i < n && j < m) {
        ++outcome.comparisons;
        if (text[i] == pattern[j]) {
            ++i;
            ++j;
        } else {
            i = i - j + 1;
            j = 0;
        }
    }
    if (j == m) outcome.first = static_cast<std::size_t>(i - m);
    return outcome;
}

MatchOutcome KmpMatcher::first(std::string_view text, std::string_view pattern) const {
    MatchOutcome outcome;
    const int n = static_cast<int>(text.size());
    const int m = static_cast<int>(pattern.size());
    if (m == 0) {
        outcome.first = 0;
        return outcome;
    }
    const std::vector<int> next = build_next_counted(pattern, outcome.prefixComparisons);
    int i = 0, j = 0;
    while (i < n && j < m) {
        if (j == -1) {
            ++i;
            ++j;
            continue;
        }
        ++outcome.comparisons;
        if (text[i] == pattern[j]) {
            ++i;
            ++j;
        } else {
            j = next[j];
        }
    }
    if (j == m) outcome.first = static_cast<std::size_t>(i - m);
    return outcome;
}

MatchOutcome KmpNextvalMatcher::first(std::string_view text, std::string_view pattern) const {
    MatchOutcome outcome;
    const int n = static_cast<int>(text.size());
    const int m = static_cast<int>(pattern.size());
    if (m == 0) {
        outcome.first = 0;
        return outcome;
    }
    const std::vector<int> next = build_next_counted(pattern, outcome.prefixComparisons);
    const std::vector<int> nextval = nextval_from_next(pattern, next);
    int i = 0, j = 0;
    while (i < n && j < m) {
        if (j == -1) {
            ++i;
            ++j;
            continue;
        }
        ++outcome.comparisons;
        if (text[i] == pattern[j]) {
            ++i;
            ++j;
        } else {
            j = nextval[j];
        }
    }
    if (j == m) outcome.first = static_cast<std::size_t>(i - m);
    return outcome;
}

}  // namespace dsa
