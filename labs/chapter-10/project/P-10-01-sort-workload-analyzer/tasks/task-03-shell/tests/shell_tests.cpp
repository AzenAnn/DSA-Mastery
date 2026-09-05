#include "sorters.hpp"

#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

using sortlab::GapSequence;
using sortlab::Record;
using sortlab::ShellSorter;

namespace {

bool sorted_keys(const std::vector<Record>& a) {
    for (std::size_t i = 1; i < a.size(); ++i) {
        if (a[i - 1].key > a[i].key) return false;
    }
    return true;
}

bool is_permutation(const std::vector<Record>& orig, const std::vector<Record>& got) {
    if (orig.size() != got.size()) return false;
    auto a = orig;
    auto b = got;
    const auto less = [](const Record& x, const Record& y) {
        return x.key != y.key ? x.key < y.key : x.tag < y.tag;
    };
    std::sort(a.begin(), a.end(), less);
    std::sort(b.begin(), b.end(), less);
    for (std::size_t i = 0; i < a.size(); ++i) {
        if (a[i].key != b[i].key || a[i].tag != b[i].tag) return false;
    }
    return true;
}

std::vector<Record> reverse_n(int n) {
    std::vector<Record> a;
    for (int i = 0; i < n; ++i) a.push_back({n - i, i});
    return a;
}

std::vector<Record> mix10() {
    const int keys[10] = {4, 2, 7, 1, 9, 3, 8, 6, 5, 2};
    std::vector<Record> a;
    for (int i = 0; i < 10; ++i) a.push_back({keys[i], i});
    return a;
}

int correctness() {
    const std::vector<std::vector<Record>> inputs = {
        reverse_n(9),
        mix10(),
        {{5, 0}, {1, 1}, {4, 2}, {1, 3}, {5, 4}},
        {},
        {{7, 0}},
    };
    for (const auto& in : inputs) {
        for (GapSequence policy : {GapSequence::Shell, GapSequence::Hibbard}) {
            ShellSorter s(policy);
            auto work = in;
            s.sort(work);
            if (!sorted_keys(work) || !is_permutation(in, work)) {
                std::cerr << "shell correctness failed (policy " << s.gapName() << ")\n";
                return 1;
            }
        }
    }
    return 0;
}

int hibbard_gaps() {
    // 同一输入、不同增量序列，比较次数应当不同——序列会影响代价。
    ShellSorter sh(GapSequence::Shell);
    ShellSorter hb(GapSequence::Hibbard);
    {
        auto a = reverse_n(9);
        sh.sort(a);
        if (sh.metrics().comparisons != 22) {
            std::cerr << "Shell(9) comparisons should be 22, got " << sh.metrics().comparisons << "\n";
            return 1;
        }
    }
    {
        auto a = reverse_n(9);
        hb.sort(a);
        if (hb.metrics().comparisons != 20) {
            std::cerr << "Hibbard(9) comparisons should be 20, got " << hb.metrics().comparisons << "\n";
            return 1;
        }
    }
    // 逆序规模增大时，Hibbard 序列优于 Shell 原始序列。
    // 注意不能用 reverse30：那里两者的增量序列恰好同为 15,7,3,1。
    ShellSorter sh2(GapSequence::Shell);
    ShellSorter hb2(GapSequence::Hibbard);
    auto a64 = reverse_n(64);
    auto b64 = reverse_n(64);
    sh2.sort(a64);
    hb2.sort(b64);
    if (hb2.metrics().comparisons >= sh2.metrics().comparisons) {
        std::cerr << "Hibbard(64) should beat Shell(64) on reverse input\n";
        return 1;
    }
    return 0;
}

int counts() {
    {
        ShellSorter sh(GapSequence::Shell);
        auto a = reverse_n(9);
        sh.sort(a);
        if (sh.metrics().moves != 28) {
            std::cerr << "Shell(9) moves should be 28, got " << sh.metrics().moves << "\n";
            return 1;
        }
    }
    {
        ShellSorter hb(GapSequence::Hibbard);
        auto a = reverse_n(9);
        hb.sort(a);
        if (hb.metrics().moves != 24) {
            std::cerr << "Hibbard(9) moves should be 24, got " << hb.metrics().moves << "\n";
            return 1;
        }
    }
    {
        ShellSorter sh(GapSequence::Shell);
        auto a = mix10();
        sh.sort(a);
        if (sh.metrics().comparisons != 27 || sh.metrics().moves != 33) {
            std::cerr << "Shell(mix10) counts wrong\n";
            return 1;
        }
    }
    {
        ShellSorter hb(GapSequence::Hibbard);
        auto a = mix10();
        hb.sort(a);
        if (hb.metrics().moves != 29) {
            std::cerr << "Hibbard(mix10) moves should be 29, got " << hb.metrics().moves << "\n";
            return 1;
        }
    }
    return 0;
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 2) return 2;
    const std::string test = argv[1];
    if (test == "correctness") return correctness();
    if (test == "hibbard-gaps") return hibbard_gaps();
    if (test == "counts") return counts();
    std::cerr << "unknown test\n";
    return 2;
}
