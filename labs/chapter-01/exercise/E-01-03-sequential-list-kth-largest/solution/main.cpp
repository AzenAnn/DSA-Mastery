#include <cstddef>
#include <iostream>
#include <vector>

struct EqualRange {
    std::size_t first{};
    std::size_t last{};
};

EqualRange partition_three_way(std::vector<long long>& a, std::size_t left, std::size_t right) {
    const long long pivot = a[left + (right - left) / 2];
    std::size_t less = left;
    std::size_t current = left;
    std::size_t greater = right;

    while (current <= greater) {
        if (a[current] < pivot) {
            std::swap(a[less++], a[current++]);
        } else if (a[current] > pivot) {
            std::swap(a[current], a[greater--]);
        } else {
            ++current;
        }
    }

    return {less, greater};
}

long long quickselect(std::vector<long long>& a, std::size_t left, std::size_t right, std::size_t target) {
    while (left < right) {
        const EqualRange equal = partition_three_way(a, left, right);
        if (target < equal.first) {
            right = equal.first - 1;
        } else if (target > equal.last) {
            left = equal.last + 1;
        } else {
            return a[target];
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

    std::cout << quickselect(a, 0, n - 1, n - k) << '\n';
}
