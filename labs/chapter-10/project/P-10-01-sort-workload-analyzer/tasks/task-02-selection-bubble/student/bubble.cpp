#include "sorters.hpp"

namespace sortlab {

const char* BubbleSorter::name() const { return "bubble"; }

bool BubbleSorter::isStable() const noexcept { return true; }

SortMetrics BubbleSorter::metrics() const { return metrics_; }

void BubbleSorter::resetMetrics() { metrics_ = SortMetrics{}; }

void BubbleSorter::sort(std::vector<Record>& a) {
    // TODO: 实现冒泡排序（带提前终止优化）。
    // 相邻两两比较，逆序则交换；某一趟没有交换即可提前结束。
    // 只有 a[j].key > a[j+1].key 才交换，才能保持稳定性。
    (void)a;
}

}  // namespace sortlab
