#include "matcher.hpp"

#include <cstddef>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

// 可编译的起点：查找/替换可用，但尚未实现 UTF-8 字符边界校验。

namespace dsa {

// TODO: 只有 pos == 0、pos == size 或该字节不是续字节时才是码点边界。
bool is_utf8_boundary(std::string_view /*text*/, std::size_t /*pos*/) {
    return true;
}

// TODO: 按 UTF-8 前缀规则统计字符数，而不是返回字节数。
std::size_t utf8_char_count(std::string_view text) {
    return text.size();
}

std::vector<std::size_t> find_all(const Matcher& matcher, std::string_view text, std::string_view pattern) {
    if (pattern.empty()) throw std::invalid_argument("pattern must not be empty");
    std::vector<std::size_t> hits;
    std::size_t cursor = 0;
    while (cursor <= text.size()) {
        const MatchOutcome outcome = matcher.first(text.substr(cursor), pattern);
        if (outcome.first == std::string::npos) break;
        const std::size_t start = cursor + outcome.first;
        hits.push_back(start);
        cursor = start + pattern.size();
    }
    return hits;
}

std::size_t count_occurrences(const Matcher& matcher, std::string_view text, std::string_view pattern) {
    return find_all(matcher, text, pattern).size();
}

std::string replace_all(const Matcher& matcher, std::string_view text, std::string_view pattern,
                        std::string_view replacement) {
    if (pattern.empty()) throw std::invalid_argument("pattern must not be empty");
    std::string result;
    std::size_t cursor = 0;
    while (cursor <= text.size()) {
        const MatchOutcome outcome = matcher.first(text.substr(cursor), pattern);
        if (outcome.first == std::string::npos) {
            result.append(text.substr(cursor));
            break;
        }
        const std::size_t start = cursor + outcome.first;
        result.append(text.substr(cursor, start - cursor));
        result.append(replacement);
        cursor = start + pattern.size();
    }
    return result;
}

}  // namespace dsa
