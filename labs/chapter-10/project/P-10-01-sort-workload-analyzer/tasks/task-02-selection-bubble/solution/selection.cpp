#include "sorters.hpp"

namespace sortlab {

const char* SelectionSorter::name() const { return "selection"; }

bool SelectionSorter::isStable() const noexcept { return false; }

SortMetrics SelectionSorter::metrics() const { return metrics_; }

void SelectionSorter::resetMetrics() { metrics_ = SortMetrics{}; }

void SelectionSorter::sort(std::vector<Record>& a) {
    const int n = static_cast<int>(a.size());
    for (int i = 0; i + 1 < n; ++i) {
        int minIndex = i;
        for (int j = i + 1; j < n; ++j) {
            ++metrics_.comparisons;
            if (a[j].key < a[minIndex].key) minIndex = j;
        }
        if (minIndex != i) {
            // 显式展开交换：三次赋值，计三次移动。
            Record tmp = a[i];
            a[i] = a[minIndex];
            a[minIndex] = tmp;
            metrics_.moves += 3;
        }
    }
}

}  // namespace sortlab
