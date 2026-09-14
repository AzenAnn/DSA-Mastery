#include "sorters.hpp"

#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

using sortlab::BubbleSorter;
using sortlab::Record;
using sortlab::SelectionSorter;

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

int selection_correctness() {
    const std::vector<std::vector<Record>> inputs = {
        {{3, 0}, {1, 1}, {2, 2}},
        {{5, 0}, {4, 1}, {3, 2}, {2, 3}, {1, 4}},
        {{1, 0}, {1, 1}, {1, 2}},
        {},
        {{7, 0}},
    };
    for (const auto& in : inputs) {
        SelectionSorter s;
        auto work = in;
        s.sort(work);
        if (!sorted_keys(work) || !is_permutation(in, work)) {
            std::cerr << "selection correctness failed on an input\n";
            return 1;
        }
    }
    return 0;
}

int selection_instability() {
    // 正文反例：[5a, 5b, 3]。第一趟选出最小值 3 与 5a 交换，两个 5 的相对顺序被颠倒。
    SelectionSorter s;
    std::vector<Record> a = {{5, 0}, {5, 1}, {3, 2}};
    s.sort(a);
    if (!sorted_keys(a)) {
        std::cerr << "selection instability: not even sorted\n";
        return 1;
    }
    if (stable_tags(a)) {
        std::cerr << "selection unexpectedly preserved equal-key order\n";
        return 1;
    }
    return 0;
}

int bubble_correctness() {
    const std::vector<std::vector<Record>> inputs = {
        {{3, 0}, {1, 1}, {2, 2}},
        {{5, 0}, {4, 1}, {3, 2}, {2, 3}, {1, 4}},
        {{1, 0}, {1, 1}, {1, 2}},
        {},
        {{7, 0}},
    };
    for (const auto& in : inputs) {
        BubbleSorter s;
        auto work = in;
        s.sort(work);
        if (!sorted_keys(work) || !is_permutation(in, work)) {
            std::cerr << "bubble correctness failed on an input\n";
            return 1;
        }
    }
    return 0;
}

int bubble_stability() {
    BubbleSorter s;
    std::vector<Record> a = {{2, 0}, {1, 1}, {2, 2}, {1, 3}, {3, 4}};
    s.sort(a);
    if (!sorted_keys(a) || !stable_tags(a)) {
        std::cerr << "bubble stability failed\n";
        return 1;
    }
    return 0;
}

int selection_bubble_counts() {
    {
        SelectionSorter s;
        std::vector<Record> a = {{3, 0}, {1, 1}, {2, 2}};
        s.sort(a);
        if (s.metrics().comparisons != 3 || s.metrics().moves != 6) {
            std::cerr << "selection count on [3,1,2] is wrong\n";
            return 1;
        }
    }
    {
        SelectionSorter s;
        std::vector<Record> a = {{5, 0}, {4, 1}, {3, 2}, {2, 3}, {1, 4}};
        s.sort(a);
        if (s.metrics().comparisons != 10 || s.metrics().moves != 6) {
            std::cerr << "selection count on reverse 5 is wrong\n";
            return 1;
        }
    }
    {
        BubbleSorter s;
        std::vector<Record> a = {{3, 0}, {1, 1}, {2, 2}};
        s.sort(a);
        if (s.metrics().comparisons != 3 || s.metrics().moves != 6) {
            std::cerr << "bubble count on [3,1,2] is wrong\n";
            return 1;
        }
    }
    {
        BubbleSorter s;
        std::vector<Record> a = {{1, 0}, {2, 1}, {3, 2}};
        s.sort(a);
        if (s.metrics().comparisons != 2 || s.metrics().moves != 0) {
            std::cerr << "bubble count on sorted [1,2,3] is wrong (early exit?)\n";
            return 1;
        }
    }
    return 0;
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 2) return 2;
    const std::string test = argv[1];
    if (test == "selection-correctness") return selection_correctness();
    if (test == "selection-instability") return selection_instability();
    if (test == "bubble-correctness") return bubble_correctness();
    if (test == "bubble-stability") return bubble_stability();
    if (test == "selection-bubble-counts") return selection_bubble_counts();
    std::cerr << "unknown test\n";
    return 2;
}
