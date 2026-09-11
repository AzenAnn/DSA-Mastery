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
    // TODO: 实现希尔排序。
    // 1) 依据 policy_ 计算增量序列（Shell: n/2 折半到 1；Hibbard: 1,3,7,...,2^k-1, 最大不超过 n/3）。
    // 2) 对每个增量 h，做一次按步长 h 的插入排序（把 a[i] 插入到 a[i-h], a[i-2h], ... 中）。
    // 比较与移动的计数口径与插入排序一致。
    (void)a;
}

}  // namespace sortlab
