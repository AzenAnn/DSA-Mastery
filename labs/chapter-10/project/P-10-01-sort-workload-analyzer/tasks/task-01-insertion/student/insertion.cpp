#include "sorters.hpp"

namespace sortlab {

const char* InsertionSorter::name() const { return "insertion"; }

bool InsertionSorter::isStable() const noexcept { return true; }

SortMetrics InsertionSorter::metrics() const { return metrics_; }

void InsertionSorter::resetMetrics() { metrics_ = SortMetrics{}; }

void InsertionSorter::sort(std::vector<Record>& a) {
    // TODO: 实现插入排序。
    // 把 a[0..i-1] 视为已排好序的前缀，每次把 a[i] 插入到前缀中的正确位置。
    // 记得：每比较一次 key 就 ++metrics_.comparisons，
    //       每把一个 Record 写入数组位置就 ++metrics_.moves（读取到局部变量不计）。
    (void)a;
}

}  // namespace sortlab
