#include "matcher.hpp"
#include "workload.hpp"

#include <cstdint>
#include <iostream>
#include <map>
#include <string>
#include <vector>

namespace {

std::string read_stdin_text() {
    std::string text, line;
    while (std::getline(std::cin, line)) {
        if (!text.empty()) text.push_back('\n');
        text.append(line);
    }
    return text;
}

long long first_or_neg1(std::size_t first) {
    return first == std::string::npos ? -1 : static_cast<long long>(first);
}

void print_positions(const std::vector<std::size_t>& positions) {
    if (positions.empty()) {
        std::cout << "none\n";
        return;
    }
    for (std::size_t i = 0; i < positions.size(); ++i) {
        if (i) std::cout << ' ';
        std::cout << positions[i];
    }
    std::cout << '\n';
}

int usage() {
    std::cerr
        << "usage:\n"
        << "  match_engine first|count|findall|replace|compare <pattern> [replacement]   # text from stdin\n"
        << "  match_engine workload --profile random-text|repeated-prefix|worst-case|realistic|stream --size <n> --seed <n>\n";
    return 2;
}

}  // namespace

int main(int argc, char** argv) {
    if (argc < 2) return usage();
    const std::string command = argv[1];

    if (command == "workload") {
        std::string profile_name;
        std::size_t size = 4096;
        std::uint32_t seed = 42;
        for (int i = 2; i + 1 < argc; i += 2) {
            const std::string key = argv[i];
            const std::string value = argv[i + 1];
            if (key == "--profile") profile_name = value;
            else if (key == "--size") size = std::stoull(value);
            else if (key == "--seed") seed = static_cast<std::uint32_t>(std::stoul(value));
        }
        static const std::map<std::string, dsa::WorkloadProfile> profiles = {
            {"random-text", dsa::WorkloadProfile::RandomText},
            {"repeated-prefix", dsa::WorkloadProfile::RepeatedPrefix},
            {"worst-case", dsa::WorkloadProfile::WorstCase},
            {"realistic", dsa::WorkloadProfile::Realistic},
            {"stream", dsa::WorkloadProfile::Stream},
        };
        const auto found = profiles.find(profile_name);
        if (found == profiles.end()) return usage();

        const dsa::WorkloadSpec spec = dsa::make_workload(found->second, size, seed);
        dsa::NaiveMatcher naive;
        dsa::KmpMatcher kmp;
        dsa::KmpNextvalMatcher nextval;
        const dsa::MatchOutcome n = naive.first(spec.text, spec.pattern);
        const dsa::MatchOutcome k = kmp.first(spec.text, spec.pattern);
        const dsa::MatchOutcome v = nextval.first(spec.text, spec.pattern);
        std::cout << "Profile: " << profile_name << '\n';
        std::cout << "Size: " << spec.text.size() << "  Seed: " << seed << '\n';
        std::cout << "matcher first comparisons prefix\n";
        std::cout << "naive   " << first_or_neg1(n.first) << ' ' << n.comparisons << ' ' << n.prefixComparisons << '\n';
        std::cout << "kmp     " << first_or_neg1(k.first) << ' ' << k.comparisons << ' ' << k.prefixComparisons << '\n';
        std::cout << "nextval " << first_or_neg1(v.first) << ' ' << v.comparisons << ' ' << v.prefixComparisons << '\n';
        return 0;
    }

    if (argc < 3) return usage();
    const std::string pattern = argv[2];
    const std::string replacement = argc >= 4 ? argv[3] : "";
    const std::string text = read_stdin_text();

    dsa::NaiveMatcher naive;
    dsa::KmpMatcher kmp;
    dsa::KmpNextvalMatcher nextval;

    if (command == "first") {
        const dsa::MatchOutcome outcome = kmp.first(text, pattern);
        std::cout << "first=" << first_or_neg1(outcome.first) << '\n';
        return 0;
    }
    if (command == "count") {
        std::cout << "count=" << dsa::count_occurrences(naive, text, pattern) << '\n';
        return 0;
    }
    if (command == "findall") {
        print_positions(dsa::find_all(kmp, text, pattern));
        return 0;
    }
    if (command == "replace") {
        std::cout << dsa::replace_all(naive, text, pattern, replacement) << '\n';
        return 0;
    }
    if (command == "compare") {
        const dsa::MatchOutcome n = naive.first(text, pattern);
        const dsa::MatchOutcome k = kmp.first(text, pattern);
        const dsa::MatchOutcome v = nextval.first(text, pattern);
        std::cout << "naive   first=" << first_or_neg1(n.first) << " comparisons=" << n.comparisons
                  << " prefix=" << n.prefixComparisons << '\n';
        std::cout << "kmp     first=" << first_or_neg1(k.first) << " comparisons=" << k.comparisons
                  << " prefix=" << k.prefixComparisons << '\n';
        std::cout << "nextval first=" << first_or_neg1(v.first) << " comparisons=" << v.comparisons
                  << " prefix=" << v.prefixComparisons << '\n';
        return 0;
    }
    return usage();
}
