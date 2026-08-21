#include "matcher.hpp"
#include "workload.hpp"

#include <cstdint>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace {

using dsa::KmpMatcher;
using dsa::KmpNextvalMatcher;
using dsa::MatchOutcome;
using dsa::NaiveMatcher;
using dsa::WorkloadProfile;

int semantic() {
    const std::vector<std::pair<std::string, std::string>> cases = {
        {"abababc", "ababc"},
        {"abcabcabc", "abc"},
        {"hello world", "world"},
        {"aaaaa", "aa"},
        {"abc", ""},
        {"", "a"},
        {"a", "a"},
        {"hello", "xyz"},
        {"ab", "abc"},
        {"aaaaaaaaab", "aaaab"},
        {"abababab", "aba"},
    };
    NaiveMatcher naive;
    KmpMatcher kmp;
    KmpNextvalMatcher nextval;
    for (const auto& [text, pattern] : cases) {
        const MatchOutcome a = naive.first(text, pattern);
        const MatchOutcome b = kmp.first(text, pattern);
        const MatchOutcome c = nextval.first(text, pattern);
        if (a.first != b.first || b.first != c.first) {
            std::cerr << "semantic mismatch: text='" << text << "' pattern='" << pattern << "'\n";
            return 1;
        }
    }
    // 空模式约定：出现在位置 0，且匹配阶段比较次数为 0。
    const MatchOutcome empty = kmp.first("anything", "");
    if (empty.first != 0 || empty.comparisons != 0 || empty.prefixComparisons != 0) return 1;
    return 0;
}

int next_suite() {
    const std::vector<int> next_ababc = dsa::build_next("ababc");
    const std::vector<int> expect_next_ababc = {-1, 0, 0, 1, 2};
    if (next_ababc != expect_next_ababc) return 1;

    const std::vector<int> next_abcdabd = dsa::build_next("ABCDABD");
    const std::vector<int> expect_next_abcdabd = {-1, 0, 0, 0, 0, 1, 2};
    if (next_abcdabd != expect_next_abcdabd) return 1;

    const std::vector<int> nextval_aaaab = dsa::build_nextval("aaaab");
    const std::vector<int> expect_nextval_aaaab = {-1, -1, -1, -1, 3};
    if (nextval_aaaab != expect_nextval_aaaab) return 1;

    const std::vector<int> nextval_ababc = dsa::build_nextval("ababc");
    const std::vector<int> expect_nextval_ababc = {-1, 0, -1, 0, 2};
    if (nextval_ababc != expect_nextval_ababc) return 1;

    const std::vector<int> next_single = dsa::build_next("a");
    if (next_single.size() != 1 || next_single[0] != -1) return 1;
    const std::vector<int> nextval_single = dsa::build_nextval("a");
    if (nextval_single.size() != 1 || nextval_single[0] != -1) return 1;
    return 0;
}

int textops() {
    NaiveMatcher naive;
    KmpMatcher kmp;
    KmpNextvalMatcher nextval;

    // 非重叠查找："aaaaa" 中 "aa" 只在 0 和 2 两处（位置 4 只剩一个字符）。
    const std::vector<std::size_t> expect_hits = {0, 2};
    if (dsa::find_all(naive, "aaaaa", "aa") != expect_hits) return 1;
    if (dsa::count_occurrences(kmp, "aaaaa", "aa") != 2) return 1;
    if (dsa::count_occurrences(nextval, "banana", "na") != 2) return 1;

    // 非重叠替换（与 lab-03-08 语义一致）。
    if (dsa::replace_all(naive, "banana", "na", "NA") != "baNANA") return 1;
    if (dsa::replace_all(kmp, "hello world", "l", "L") != "heLLo worLd") return 1;

    // UTF-8：完整码点命中。
    const std::string e_acute = "\xC3\xA9";  // é
    if (dsa::replace_all(naive, e_acute + e_acute, e_acute, "x") != "xx") return 1;
    const std::vector<std::size_t> utf8_hits = dsa::find_all(kmp, e_acute + e_acute, e_acute);
    if (utf8_hits.size() != 2 || utf8_hits[0] != 0 || utf8_hits[1] != 2) return 1;
    const std::vector<std::size_t> utf8_mid = dsa::find_all(kmp, "a" + e_acute + "a", e_acute);
    if (utf8_mid.size() != 1 || utf8_mid[0] != 1) return 1;

    // UTF-8：跨码点边界的字节命中被拒绝。
    const std::string continuation = "\xA9";
    if (!dsa::find_all(naive, e_acute, continuation).empty()) return 1;
    if (dsa::replace_all(kmp, e_acute, continuation, "X") != e_acute) return 1;

    // 空 pattern：抛 std::invalid_argument。
    bool threw = false;
    try {
        (void)dsa::find_all(naive, "abc", "");
    } catch (const std::invalid_argument&) {
        threw = true;
    }
    if (!threw) return 1;
    threw = false;
    try {
        (void)dsa::replace_all(kmp, "abc", "", "x");
    } catch (const std::invalid_argument&) {
        threw = true;
    }
    if (!threw) return 1;

    // 空文本。
    if (!dsa::find_all(naive, "", "a").empty()) return 1;
    if (dsa::replace_all(kmp, "", "a", "b") != "") return 1;

    // UTF-8 字符计数。
    const std::string hello_cn = "\xE4\xBD\xA0\xE5\xA5\xBD";  // 你好
    if (dsa::utf8_char_count("") != 0) return 1;
    if (dsa::utf8_char_count("hello") != 5) return 1;
    if (dsa::utf8_char_count(hello_cn) != 2) return 1;
    if (dsa::utf8_char_count("a" + e_acute) != 2) return 1;
    return 0;
}

int cost() {
    NaiveMatcher naive;
    KmpMatcher kmp;
    KmpNextvalMatcher nextval;

    // 教材示例：abababc / ababc，朴素 11 次、KMP 8 次、prefix 3 次。
    {
        const MatchOutcome n = naive.first("abababc", "ababc");
        const MatchOutcome k = kmp.first("abababc", "ababc");
        const MatchOutcome v = nextval.first("abababc", "ababc");
        if (n.first != 2 || n.comparisons != 11 || n.prefixComparisons != 0) return 1;
        if (k.first != 2 || k.comparisons != 8 || k.prefixComparisons != 3) return 1;
        if (v.first != 2 || v.comparisons != 8 || v.prefixComparisons != 3) return 1;
    }

    // 重复前缀：aaaaaaaaab / aaaab，朴素 30 次、KMP 15 次、prefix 3 次。
    {
        const MatchOutcome n = naive.first("aaaaaaaaab", "aaaab");
        const MatchOutcome k = kmp.first("aaaaaaaaab", "aaaab");
        const MatchOutcome v = nextval.first("aaaaaaaaab", "aaaab");
        if (n.first != 5 || n.comparisons != 30) return 1;
        if (k.first != 5 || k.comparisons != 15 || k.prefixComparisons != 3) return 1;
        if (v.first != 5 || v.comparisons != 15 || v.prefixComparisons != 3) return 1;
    }
    return 0;
}

int workload() {
    NaiveMatcher naive;
    KmpMatcher kmp;
    KmpNextvalMatcher nextval;

    // 精确锚点 1：repeated-prefix size=16 -> pattern="aaab"，text=15 个 'a' + 'b'。
    {
        const dsa::WorkloadSpec spec = dsa::make_workload(WorkloadProfile::RepeatedPrefix, 16, 1);
        if (spec.text.size() != 16 || spec.pattern != "aaab") return 1;
        const MatchOutcome n = naive.first(spec.text, spec.pattern);
        const MatchOutcome k = kmp.first(spec.text, spec.pattern);
        const MatchOutcome v = nextval.first(spec.text, spec.pattern);
        if (n.first != 12 || n.comparisons != 52) return 1;
        if (k.first != 12 || k.comparisons != 28 || k.prefixComparisons != 2) return 1;
        if (v.first != 12 || v.comparisons != 28 || v.prefixComparisons != 2) return 1;
    }

    // 精确锚点 2：worst-case size=32 -> pattern="0001"，text=31 个 '0' + '1'。
    {
        const dsa::WorkloadSpec spec = dsa::make_workload(WorkloadProfile::WorstCase, 32, 7);
        if (spec.pattern != "0001") return 1;
        const MatchOutcome n = naive.first(spec.text, spec.pattern);
        const MatchOutcome k = kmp.first(spec.text, spec.pattern);
        const MatchOutcome v = nextval.first(spec.text, spec.pattern);
        if (n.first != 28 || n.comparisons != 116) return 1;
        if (k.first != 28 || k.comparisons != 60 || k.prefixComparisons != 2) return 1;
        if (v.first != 28 || v.comparisons != 60 || v.prefixComparisons != 2) return 1;
    }

    // 五类 profile：同一 seed 两次生成一致、三实现位置一致、两次运行计数一致。
    const std::vector<WorkloadProfile> profiles = {
        WorkloadProfile::RandomText,
        WorkloadProfile::RepeatedPrefix,
        WorkloadProfile::WorstCase,
        WorkloadProfile::Realistic,
        WorkloadProfile::Stream,
    };
    for (const WorkloadProfile profile : profiles) {
        const dsa::WorkloadSpec a = dsa::make_workload(profile, 64, 1);
        const dsa::WorkloadSpec b = dsa::make_workload(profile, 64, 1);
        if (a.text != b.text || a.pattern != b.pattern) return 1;
        const MatchOutcome n = naive.first(a.text, a.pattern);
        const MatchOutcome k1 = kmp.first(a.text, a.pattern);
        const MatchOutcome k2 = kmp.first(b.text, b.pattern);
        const MatchOutcome v = nextval.first(a.text, a.pattern);
        if (n.first != k1.first || k1.first != v.first) return 1;
        if (k1.comparisons != k2.comparisons || k1.prefixComparisons != k2.prefixComparisons) return 1;
    }

    // 线性上界：size=1024 时 KMP 匹配比较不超过 2n + m；worst-case 朴素显著多于 KMP。
    for (const WorkloadProfile profile : profiles) {
        const dsa::WorkloadSpec spec = dsa::make_workload(profile, 1024, 3);
        const MatchOutcome k = kmp.first(spec.text, spec.pattern);
        const std::uint64_t bound = 2 * spec.text.size() + spec.pattern.size();
        if (k.comparisons > bound) return 1;
        const MatchOutcome n = naive.first(spec.text, spec.pattern);
        if (profile == WorkloadProfile::WorstCase && n.comparisons <= k.comparisons) return 1;
    }
    return 0;
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 2) return 2;
    const std::string test = argv[1];
    if (test == "semantic") return semantic();
    if (test == "next") return next_suite();
    if (test == "textops") return textops();
    if (test == "cost") return cost();
    if (test == "workload") return workload();
    std::cerr << "unknown test\n";
    return 2;
}
