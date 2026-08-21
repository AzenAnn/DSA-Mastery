#ifndef DSA_LAB_MATCHER_HPP
#define DSA_LAB_MATCHER_HPP

#include <cstddef>
#include <cstdint>
#include <string>
#include <string_view>
#include <vector>

namespace dsa {

// 一次匹配的结果。
// first：0-based 首次出现位置；未找到为 std::string::npos；空模式约定为 0。
// comparisons：匹配阶段执行的字符比较次数（含失配）。
// prefixComparisons：构建 next/nextval 时真实执行的字符比较次数；朴素匹配恒为 0。
struct MatchOutcome {
    std::size_t first = std::string::npos;
    std::uint64_t comparisons = 0;
    std::uint64_t prefixComparisons = 0;
};

// 0-based、next[0] = -1 的 next 表（与正文 3.2 一致）。
std::vector<int> build_next(std::string_view pattern);

// 在 next 基础上压缩必然失配回退的 nextval 表。
std::vector<int> build_nextval(std::string_view pattern);

// 统一匹配契约：三种实现必须对同一输入返回相同位置。
class Matcher {
public:
    virtual ~Matcher() = default;
    virtual MatchOutcome first(std::string_view text, std::string_view pattern) const = 0;
    virtual const char* name() const noexcept = 0;
};

class NaiveMatcher final : public Matcher {
public:
    MatchOutcome first(std::string_view text, std::string_view pattern) const override;
    const char* name() const noexcept override { return "naive"; }
};

class KmpMatcher final : public Matcher {
public:
    MatchOutcome first(std::string_view text, std::string_view pattern) const override;
    const char* name() const noexcept override { return "kmp"; }
};

class KmpNextvalMatcher final : public Matcher {
public:
    MatchOutcome first(std::string_view text, std::string_view pattern) const override;
    const char* name() const noexcept override { return "nextval"; }
};

// —— 文本处理引擎 ——
// 以下操作均为非重叠、自左向右；空 pattern 抛 std::invalid_argument。
std::vector<std::size_t> find_all(const Matcher& matcher, std::string_view text, std::string_view pattern);
std::size_t count_occurrences(const Matcher& matcher, std::string_view text, std::string_view pattern);
std::string replace_all(const Matcher& matcher, std::string_view text, std::string_view pattern,
                        std::string_view replacement);

// UTF-8 工具：pos 是否落在码点边界（pos==0、pos==size 或该字节不是续字节）。
bool is_utf8_boundary(std::string_view text, std::size_t pos);
std::size_t utf8_char_count(std::string_view text);

}  // namespace dsa

#endif  // DSA_LAB_MATCHER_HPP
