#include "sorters.hpp"

namespace sortlab {

const char* InsertionSorter::name() const { return "insertion"; }

bool InsertionSorter::isStable() const noexcept { return true; }

SortMetrics InsertionSorter::metrics() const { return metrics_; }

void InsertionSorter::resetMetrics() { metrics_ = SortMetrics{}; }

void InsertionSorter::sort(std::vector<Record>& a) {
    const int n = static_cast<int>(a.size());
    for (int i = 1; i < n; ++i) {
        Record key = a[i];  // 读取到局部变量，不是移动
        int j = i - 1;
        while (j >= 0) {
            ++metrics_.comparisons;  // 每比较一次 key 就计一次
            if (a[j].key > key.key) {
                a[j + 1] = a[j];     // 平移，计一次移动
                ++metrics_.moves;
                --j;
            } else {
                break;
            }
        }
        a[j + 1] = key;              // 落位，计一次移动
        ++metrics_.moves;
    }
}

}  // namespace sortlab
