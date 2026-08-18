#include <cstddef>
#include <iostream>
#include <vector>

// Partition around pivot; return its final position in descending order.
std::size_t partition(std::vector<long long>& a, std::size_t left, std::size_t right) {
    long long pivot = a[right];
    std::size_t i = left;
    for (std::size_t j = left; j < right; ++j) {
        if (a[j] >= pivot) {
            std::swap(a[i], a[j]);
            ++i;
        }
    }
    std::swap(a[i], a[right]);
    return i;
}

// Quickselect: find the element that would be at index `target` in a descending-sorted array.
long long quickselect(std::vector<long long>& a, std::size_t left, std::size_t right, std::size_t target) {
    while (left < right) {
        std::size_t p = partition(a, left, right);
        if (p == target) {
            return a[p];
        } else if (p < target) {
            left = p + 1;
        } else {
            right = p - 1;
        }
    }
    return a[left];
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0, k = 0;
    std::cin >> n >> k;
    std::vector<long long> a(n);
    for (auto& v : a) std::cin >> v;

    // target index in descending order: the k-th largest is at position (k - 1).
    std::cout << quickselect(a, 0, n - 1, k - 1) << '\n';
}
