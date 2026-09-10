#include "matcher.hpp"

#include <cstddef>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

namespace dsa {

namespace {

bool pattern_starts_at_boundary(std::string_view pattern) {
    if (pattern.empty()) return true;
    return (static_cast<unsigned char>(pattern[0]) & 0xC0) != 0x80;
}

bool valid_hit(std::string_view text, std::size_t start, std::size_t length, std::string_view pattern) {
    return pattern_starts_at_boundary(pattern) && is_utf8_boundary(text, start) &&
           is_utf8_boundary(text, start + length);
}

}  // namespace

bool is_utf8_boundary(std::string_view text, std::size_t pos) {
    if (pos == 0 || pos >= text.size()) return true;
    return (static_cast<unsigned char>(text[pos]) & 0xC0) != 0x80;
}

std::size_t utf8_char_count(std::string_view text) {
    std::size_t count = 0;
    for (std::size_t i = 0; i < text.size();) {
        const unsigned char c = static_cast<unsigned char>(text[i]);
        if ((c & 0x80) == 0) {
            i += 1;
        } else if ((c & 0xE0) == 0xC0) {
            i += 2;
        } else if ((c & 0xF0) == 0xE0) {
            i += 3;
        } else if ((c & 0xF8) == 0xF0) {
            i += 4;
        } else {
            i += 1;
        }
        ++count;
    }
    return count;
}

std::vector<std::size_t> find_all(const Matcher& matcher, std::string_view text, std::string_view pattern) {
    if (pattern.empty()) throw std::invalid_argument("pattern must not be empty");
    std::vector<std::size_t> hits;
    std::size_t cursor = 0;
    const std::size_t pattern_size = pattern.size();
    while (cursor <= text.size()) {
        const MatchOutcome outcome = matcher.first(text.substr(cursor), pattern);
        if (outcome.first == std::string::npos) break;
        const std::size_t start = cursor + outcome.first;
        if (valid_hit(text, start, pattern_size, pattern)) {
            hits.push_back(start);
            cursor = start + pattern_size;
        } else {
            cursor = start + 1;
        }
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
    const std::size_t pattern_size = pattern.size();
    while (cursor <= text.size()) {
        const MatchOutcome outcome = matcher.first(text.substr(cursor), pattern);
        if (outcome.first == std::string::npos) {
            result.append(text.substr(cursor));
            break;
        }
        const std::size_t start = cursor + outcome.first;
        if (valid_hit(text, start, pattern_size, pattern)) {
            result.append(text.substr(cursor, start - cursor));
            result.append(replacement);
            cursor = start + pattern_size;
        } else {
            result.append(text.substr(cursor, start - cursor + 1));
            cursor = start + 1;
        }
    }
    return result;
}

}  // namespace dsa
