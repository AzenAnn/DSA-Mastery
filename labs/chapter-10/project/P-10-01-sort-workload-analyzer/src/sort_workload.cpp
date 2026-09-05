#include "sorters.hpp"

#include <algorithm>
#include <chrono>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

using sortlab::BubbleSorter;
using sortlab::GapSequence;
using sortlab::InsertionSorter;
using sortlab::Record;
using sortlab::SelectionSorter;
using sortlab::ShellSorter;
using sortlab::Sorter;

namespace {

// 确定性随机数（xorshift32），保证同一参数在任何平台产生相同序列。
struct XorShift32 {
    std::uint32_t state;
    explicit XorShift32(std::uint32_t seed) : state(seed ? seed : 0x9e3779b9u) {}
    std::uint32_t next() {
        std::uint32_t x = state;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        state = x;
        return x;
    }
};

std::vector<Record> make_input(const std::string& profile, int n, XorShift32& rng) {
    std::vector<Record> a(n);
    for (int i = 0; i < n; ++i) a[i].tag = i;
    if (profile == "ascending") {
        for (int i = 0; i < n; ++i) a[i].key = i;
    } else if (profile == "descending") {
        for (int i = 0; i < n; ++i) a[i].key = n - 1 - i;
    } else if (profile == "few-unique") {
        for (int i = 0; i < n; ++i) a[i].key = static_cast<int>(rng.next() % 4);
    } else if (profile == "random") {
        for (int i = 0; i < n; ++i) a[i].key = static_cast<int>(rng.next() % (n * 2 + 1));
    } else {
        std::cerr << "unknown profile: " << profile << "\n";
        std::exit(2);
    }
    return a;
}

bool sorted_keys(const std::vector<Record>& a) {
    for (std::size_t i = 1; i < a.size(); ++i) {
        if (a[i - 1].key > a[i].key) return false;
    }
    return true;
}

bool stable_tags(const std::vector<Record>& a) {
    for (std::size_t i = 1; i < a.size(); ++i) {
        if (a[i - 1].key == a[i].key && a[i - 1].tag >= a[i].tag) return false;
    }
    return true;
}

// 希尔排序的两个变体在表格里都要可区分，因此在 family 名后附加增量序列名。
std::string label(const Sorter& s) {
    if (const auto* shell = dynamic_cast<const ShellSorter*>(&s)) {
        return std::string(shell->name()) + "(" + shell->gapName() + ")";
    }
    return s.name();
}

double time_ms(Sorter& sorter, std::vector<Record> input) {
    // 预热一次，再取三次计时中位数；时间只作观察证据，不进入自动评分。
    sorter.resetMetrics();
    sorter.sort(input);

    double best[3];
    for (int round = 0; round < 3; ++round) {
        auto work = input;
        const auto start = std::chrono::steady_clock::now();
        sorter.sort(work);
        const auto end = std::chrono::steady_clock::now();
        best[round] = std::chrono::duration<double, std::milli>(end - start).count();
    }
    std::sort(best, best + 3);
    return best[1];
}

void print_human(const std::string& profile, int n, std::uint32_t seed,
                 const std::vector<Record>& base,
                 const std::vector<std::unique_ptr<Sorter>>& sorters) {
    std::cout << "Profile: " << profile << "  Size: " << n << "  Seed: " << seed << "\n\n";
    std::cout << std::left << std::setw(15) << "sorter"
              << std::setw(8) << "stable"
              << std::setw(12) << "comparisons"
              << std::setw(8) << "moves"
              << std::setw(8) << "sorted"
              << std::setw(15) << "stableObserved"
              << "timeMs\n";
    for (const auto& s : sorters) {
        s->resetMetrics();
        auto work = base;
        s->sort(work);
        const bool sorted = sorted_keys(work);
        const bool stable = stable_tags(work);
        const double ms = time_ms(*s, base);
        std::cout << std::left << std::setw(15) << label(*s)
                  << std::setw(8) << (s->isStable() ? "yes" : "no")
                  << std::setw(12) << s->metrics().comparisons
                  << std::setw(8) << s->metrics().moves
                  << std::setw(8) << (sorted ? "yes" : "NO")
                  << std::setw(15) << (stable ? "yes" : "no")
                  << ms << "\n";
    }
    std::cout << "\nTiming is observational only; it is not used for automatic scoring.\n";
}

void print_json(const std::string& profile, int n, std::uint32_t seed,
                const std::vector<Record>& base,
                const std::vector<std::unique_ptr<Sorter>>& sorters) {
    std::cout << "{\n  \"reportVersion\": 1,\n  \"profile\": \"" << profile
              << "\",\n  \"size\": " << n << ",\n  \"seed\": " << seed << ",\n  \"sorters\": [\n";
    for (std::size_t i = 0; i < sorters.size(); ++i) {
        const auto& s = sorters[i];
        s->resetMetrics();
        auto work = base;
        s->sort(work);
        const double ms = time_ms(*s, base);
        std::cout << "    {\"name\": \"" << label(*s) << "\", \"stable\": "
                  << (s->isStable() ? "true" : "false")
                  << ", \"comparisons\": " << s->metrics().comparisons
                  << ", \"moves\": " << s->metrics().moves
                  << ", \"sorted\": " << (sorted_keys(work) ? "true" : "false")
                  << ", \"stableObserved\": " << (stable_tags(work) ? "true" : "false")
                  << ", \"timeMs\": " << ms << "}";
        std::cout << (i + 1 == sorters.size() ? "\n" : ",\n");
    }
    std::cout << "  ]\n}\n";
}

}  // namespace

int main(int argc, char** argv) {
    std::string profile = "random";
    int n = 1000;
    std::uint32_t seed = 42;
    bool json = false;

    for (int i = 1; i < argc; ++i) {
        const std::string arg = argv[i];
        if (arg == "--profile" && i + 1 < argc) {
            profile = argv[++i];
        } else if (arg == "--size" && i + 1 < argc) {
            n = std::stoi(argv[++i]);
        } else if (arg == "--seed" && i + 1 < argc) {
            seed = static_cast<std::uint32_t>(std::stoul(argv[++i]));
        } else if (arg == "--json") {
            json = true;
        } else {
            std::cerr << "unknown argument: " << arg << "\n";
            return 2;
        }
    }

    if (n < 0 || n > 1000000) {
        std::cerr << "--size must be in [0, 1000000]\n";
        return 2;
    }

    XorShift32 rng(seed);
    const std::vector<Record> base = make_input(profile, n, rng);

    std::vector<std::unique_ptr<Sorter>> sorters;
    sorters.push_back(std::make_unique<InsertionSorter>());
    sorters.push_back(std::make_unique<SelectionSorter>());
    sorters.push_back(std::make_unique<BubbleSorter>());
    sorters.push_back(std::make_unique<ShellSorter>(GapSequence::Shell));
    sorters.push_back(std::make_unique<ShellSorter>(GapSequence::Hibbard));

    if (json) {
        print_json(profile, n, seed, base, sorters);
    } else {
        print_human(profile, n, seed, base, sorters);
    }
    return 0;
}
