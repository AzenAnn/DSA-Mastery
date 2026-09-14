#include "sorters.hpp"

#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

using sortlab::InsertionSorter;
using sortlab::Record;

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

bool stable_tags(const std::vector<Record>& a) {
    for (std::size_t i = 1; i < a.size(); ++i) {
        if (a[i - 1].key == a[i].key && a[i - 1].tag >= a[i].tag) return false;
    }
    return true;
}

int correctness() {
    const std::vector<std::vector<Record>> inputs = {
        {{3, 0}, {1, 1}, {2, 2}},
        {{1, 0}, {2, 1}, {3, 2}},
        {{3, 0}, {2, 1}, {1, 2}},
        {{5, 0}, {1, 1}, {4, 2}, {1, 3}, {5, 4}},
        {},
        {{7, 0}},
    };
    for (const auto& in : inputs) {
        InsertionSorter s;
        auto work = in;
        s.sort(work);
        if (!sorted_keys(work) || !is_permutation(in, work)) {
            std::cerr << "insertion correctness failed on an input\n";
            return 1;
        }
    }
    return 0;
}

int stability() {
    InsertionSorter s;
    std::vector<Record> a = {{2, 0}, {1, 1}, {2, 2}, {1, 3}, {3, 4}};
    s.sort(a);
    if (!sorted_keys(a) || !stable_tags(a)) {
        std::cerr << "insertion stability failed\n";
        return 1;
    }
    return 0;
}

int counts() {
    {
        InsertionSorter s;
        std::vector<Record> a = {{3, 0}, {1, 1}, {2, 2}};
        s.sort(a);
        if (s.metrics().comparisons != 3 || s.metrics().moves != 4) {
            std::cerr << "insertion count on [3,1,2] is wrong\n";
            return 1;
        }
    }
    {
        InsertionSorter s;
        std::vector<Record> a = {{1, 0}, {2, 1}, {3, 2}};
        s.sort(a);
        if (s.metrics().comparisons != 2 || s.metrics().moves != 2) {
            std::cerr << "insertion count on sorted [1,2,3] is wrong\n";
            return 1;
        }
    }
    {
        InsertionSorter s;
        std::vector<Record> a = {{3, 0}, {2, 1}, {1, 2}};
        s.sort(a);
        if (s.metrics().comparisons != 3 || s.metrics().moves != 5) {
            std::cerr << "insertion count on reverse [3,2,1] is wrong\n";
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
    if (test == "stability") return stability();
    if (test == "counts") return counts();
    std::cerr << "unknown test\n";
    return 2;
}
