#include "sorters.hpp"

namespace sortlab {

const char* SelectionSorter::name() const { return "selection"; }

bool SelectionSorter::isStable() const noexcept { return false; }

SortMetrics SelectionSorter::metrics() const { return metrics_; }

void SelectionSorter::resetMetrics() { metrics_ = SortMetrics{}; }

void SelectionSorter::sort(std::vector<Record>& a) {
    // TODO: 实现选择排序。
    // 每趟从未排序区间选出 key 最小的元素，交换到当前起始位置。
    // 比较用 a[j].key < a[minIndex].key；交换展开为三次赋值，计三次移动。
    (void)a;
}

}  // namespace sortlab
