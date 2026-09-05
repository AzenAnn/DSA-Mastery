#include "sorters.hpp"

namespace sortlab {

ShellSorter::ShellSorter(GapSequence policy) : policy_(policy) {}

const char* ShellSorter::name() const { return "shell"; }

bool ShellSorter::isStable() const noexcept { return false; }

SortMetrics ShellSorter::metrics() const { return metrics_; }

void ShellSorter::resetMetrics() { metrics_ = SortMetrics{}; }

const char* ShellSorter::gapName() const {
    return policy_ == GapSequence::Hibbard ? "hibbard" : "shell";
}

void ShellSorter::sort(std::vector<Record>& a) {
    const int n = static_cast<int>(a.size());

    // 依据策略计算从大到小、末尾为 1 的增量序列。
    std::vector<int> gaps;
    if (policy_ == GapSequence::Hibbard) {
        int h = 1;
        while (h <= n / 3) h = 2 * h + 1;  // 2^k - 1
        while (h > 0) {
            gaps.push_back(h);
            h = (h - 1) / 2;
        }
    } else {
        for (int h = n / 2; h > 0; h /= 2) gaps.push_back(h);
    }

    // 对每个增量，做一次按步长 h 的插入排序。
    for (int h : gaps) {
        for (int i = h; i < n; ++i) {
            Record key = a[i];
            int j = i - h;
            while (j >= 0) {
                ++metrics_.comparisons;
                if (a[j].key > key.key) {
                    a[j + h] = a[j];
                    ++metrics_.moves;
                    j -= h;
                } else {
                    break;
                }
            }
            a[j + h] = key;
            ++metrics_.moves;
        }
    }
}

}  // namespace sortlab
