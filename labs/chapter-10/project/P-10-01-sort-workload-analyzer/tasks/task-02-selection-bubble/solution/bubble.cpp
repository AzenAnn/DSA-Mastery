#include "sorters.hpp"

namespace sortlab {

const char* BubbleSorter::name() const { return "bubble"; }

bool BubbleSorter::isStable() const noexcept { return true; }

SortMetrics BubbleSorter::metrics() const { return metrics_; }

void BubbleSorter::resetMetrics() { metrics_ = SortMetrics{}; }

void BubbleSorter::sort(std::vector<Record>& a) {
    const int n = static_cast<int>(a.size());
    for (int i = 0; i < n - 1; ++i) {
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; ++j) {
            ++metrics_.comparisons;
            if (a[j].key > a[j + 1].key) {
                // 显式展开交换：三次赋值，计三次移动。
                Record tmp = a[j];
                a[j] = a[j + 1];
                a[j + 1] = tmp;
                metrics_.moves += 3;
                swapped = true;
            }
        }
        if (!swapped) break;  // 提前终止：已有序
    }
}

}  // namespace sortlab
